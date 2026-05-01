const db = require("../config/db");

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function getCurrentDayAndTime() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hours}:${minutes}`;
  return { dayOfWeek, currentTime };
}

function findFallbackSlot(slots) {
  if (!slots.length) return null;

  const maisonSlot = slots.find((slot) => {
    const label = (slot.label || "").toLowerCase();
    return label.includes("maison") || label.includes("home");
  });

  return maisonSlot || slots[0];
}

async function resolveFamilyId(requestedFamilyId) {
  if (requestedFamilyId) {
    const family = await dbGet(
      "SELECT id, family_name FROM families WHERE id = ?",
      [requestedFamilyId]
    );

    if (!family) {
      throw new Error("La famille demandée est introuvable.");
    }

    return family.id;
  }

  const families = await dbAll(
    "SELECT id, family_name FROM families ORDER BY created_at ASC"
  );

  if (families.length === 0) {
    throw new Error("Aucune famille trouvée dans la base de données.");
  }

  if (families.length > 1) {
    throw new Error(
      "Plusieurs familles existent. Merci de préciser familyId dans la requête."
    );
  }

  return families[0].id;
}

async function getStartupClockConfig(requestedFamilyId = null) {
  const familyId = await resolveFamilyId(requestedFamilyId);

  const slots = await dbAll(
    `
    SELECT
      id,
      family_id,
      position_number AS slotNumber,
      label,
      angle,
      created_at
    FROM clock_positions
    WHERE family_id = ?
    ORDER BY position_number ASC
    `,
    [familyId]
  );

  if (!slots.length) {
    throw new Error(
      "Aucune position (clock_positions) trouvée pour cette famille."
    );
  }

  const { dayOfWeek, currentTime } = getCurrentDayAndTime();

  const rows = await dbAll(
    `
    SELECT
      m.id AS memberId,
      m.family_id AS familyId,
      m.name AS memberName,
      m.role AS memberRole,
      m.servo_channel AS servoChannel,

      sr.id AS ruleId,
      sr.day_of_week AS ruleDayOfWeek,
      sr.start_time AS ruleStartTime,
      sr.end_time AS ruleEndTime,
      sr.position_id AS rulePositionId,

      cp.id AS positionId,
      cp.position_number AS positionNumber,
      cp.label AS positionLabel,
      cp.angle AS positionAngle

    FROM members m

    LEFT JOIN schedule_rules sr
      ON sr.member_id = m.id
      AND sr.family_id = m.family_id
      AND sr.day_of_week = ?
      AND (
        (
          sr.start_time <= sr.end_time
          AND ? >= sr.start_time
          AND ? < sr.end_time
        )
        OR
        (
          sr.start_time > sr.end_time
          AND (
            ? >= sr.start_time
            OR ? < sr.end_time
          )
        )
      )

    LEFT JOIN clock_positions cp
      ON cp.id = sr.position_id

    WHERE m.family_id = ?
    ORDER BY m.servo_channel ASC, sr.start_time DESC
    `,
    [dayOfWeek, currentTime, currentTime, currentTime, currentTime, familyId]
  );

  const warnings = [];
  const fallbackSlot = findFallbackSlot(slots);
  const groupedMembers = new Map();

  for (const row of rows) {
    if (!groupedMembers.has(row.memberId)) {
      groupedMembers.set(row.memberId, {
        id: row.memberId,
        familyId: row.familyId,
        name: row.memberName,
        role: row.memberRole,
        servoChannel: row.servoChannel,
        matches: [],
      });
    }

    if (row.positionId) {
      groupedMembers.get(row.memberId).matches.push({
        ruleId: row.ruleId,
        positionId: row.positionId,
        currentSlot: row.positionNumber,
        label: row.positionLabel,
        angle: row.positionAngle,
      });
    }
  }

  const members = [];

  for (const [, member] of groupedMembers) {
    let selectedPosition = null;
    let source = "schedule";

    if (member.matches.length > 1) {
      warnings.push(
        `Le membre "${member.name}" a plusieurs règles actives en même temps. La plus récente a été utilisée.`
      );
    }

    if (member.matches.length > 0) {
      selectedPosition = member.matches[0];
    } else if (fallbackSlot) {
      selectedPosition = {
        positionId: fallbackSlot.id,
        currentSlot: fallbackSlot.slotNumber,
        label: fallbackSlot.label,
        angle: fallbackSlot.angle,
      };
      source = "fallback";
      warnings.push(
        `Aucune règle active pour "${member.name}" à ${currentTime}. Position de repli utilisée : "${fallbackSlot.label}".`
      );
    }

    if (!selectedPosition) continue;

    members.push({
      id: member.id,
      familyId: member.familyId,
      name: member.name,
      role: member.role,
      servoChannel: Number(member.servoChannel),
      currentSlot: Number(selectedPosition.currentSlot),
      currentPositionId: selectedPosition.positionId,
      currentLabel: selectedPosition.label,
      currentAngle: Number(selectedPosition.angle),
      source,
    });
  }

  return {
    familyId,
    generatedAt: new Date().toISOString(),
    currentDayOfWeek: dayOfWeek,
    currentTime,
    members,
    slots: slots.map((slot) => ({
      id: slot.id,
      familyId: slot.family_id,
      slotNumber: Number(slot.slotNumber),
      label: slot.label,
      angle: Number(slot.angle),
      createdAt: slot.created_at,
    })),
    warnings,
  };
}

module.exports = getStartupClockConfig;