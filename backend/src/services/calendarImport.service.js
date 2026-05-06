const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const ensureScheduleSchema = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS schedule_rules (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      position_id TEXT NOT NULL,
      title TEXT,
      source TEXT DEFAULT 'manual',
      planning_mode TEXT DEFAULT 'manual_only',
      provider TEXT DEFAULT 'none',
      external_event_id TEXT,
      conflict_status TEXT DEFAULT 'none',
      conflict_with_id TEXT,
      conflict_resolution TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  const columns = await all(`PRAGMA table_info(schedule_rules)`);
  const existingColumns = columns.map((column) => column.name);

  const columnsToAdd = [
    {
      name: "title",
      sql: "ALTER TABLE schedule_rules ADD COLUMN title TEXT",
    },
    {
      name: "source",
      sql: "ALTER TABLE schedule_rules ADD COLUMN source TEXT DEFAULT 'manual'",
    },
    {
      name: "planning_mode",
      sql: "ALTER TABLE schedule_rules ADD COLUMN planning_mode TEXT DEFAULT 'manual_only'",
    },
    {
      name: "provider",
      sql: "ALTER TABLE schedule_rules ADD COLUMN provider TEXT DEFAULT 'none'",
    },
    {
      name: "external_event_id",
      sql: "ALTER TABLE schedule_rules ADD COLUMN external_event_id TEXT",
    },
    {
      name: "conflict_status",
      sql: "ALTER TABLE schedule_rules ADD COLUMN conflict_status TEXT DEFAULT 'none'",
    },
    {
      name: "conflict_with_id",
      sql: "ALTER TABLE schedule_rules ADD COLUMN conflict_with_id TEXT",
    },
    {
      name: "conflict_resolution",
      sql: "ALTER TABLE schedule_rules ADD COLUMN conflict_resolution TEXT",
    },
    {
      name: "is_active",
      sql: "ALTER TABLE schedule_rules ADD COLUMN is_active INTEGER DEFAULT 1",
    },
    {
      name: "updated_at",
      sql: "ALTER TABLE schedule_rules ADD COLUMN updated_at TEXT",
    },
  ];

  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      await run(column.sql);
    }
  }
};

const normalizeText = (value) => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const toTime = (dateValue) => {
  const date = new Date(dateValue);
  return date.toTimeString().slice(0, 5);
};

const toDayOfWeek = (dateValue) => {
  const date = new Date(dateValue);
  return date.getDay();
};

const hasOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

const getSourcePriority = (source) => {
  if (source === "manual") return 2;
  if (source === "google" || source === "outlook") return 1;
  return 0;
};

const getClockPositionsByFamily = async (familyId) => {
  return all(
    `
      SELECT id, family_id, position_number, label, angle
      FROM clock_positions
      WHERE family_id = ?
      ORDER BY position_number ASC
    `,
    [familyId]
  );
};

const findPositionByPossibleLabels = (positions, possibleLabels) => {
  const normalizedPossibleLabels = possibleLabels.map(normalizeText);

  return positions.find((position) => {
    const normalizedPositionLabel = normalizeText(position.label);

    return normalizedPossibleLabels.some((label) => {
      return (
        normalizedPositionLabel === label ||
        normalizedPositionLabel.includes(label) ||
        label.includes(normalizedPositionLabel)
      );
    });
  });
};

const detectPositionFromEventTitle = ({
  eventTitle,
  positions,
  defaultPositionId,
}) => {
  const normalizedTitle = normalizeText(eventTitle);

  if (!normalizedTitle) {
    return defaultPositionId;
  }

  for (const position of positions) {
    const normalizedPositionLabel = normalizeText(position.label);

    if (
      normalizedPositionLabel.length >= 3 &&
      normalizedTitle.includes(normalizedPositionLabel)
    ) {
      return position.id;
    }
  }

  const keywordRules = [
    {
      positionLabels: ["travail", "bureau", "pro"],
      keywords: [
        "travail",
        "bureau",
        "reunion",
        "meeting",
        "call",
        "appel",
        "client",
        "pro",
        "zoom",
        "teams",
        "visio",
        "conference",
        "formation",
      ],
    },
    {
      positionLabels: ["ecole", "école", "cours", "classe"],
      keywords: [
        "ecole",
        "cours",
        "classe",
        "prof",
        "devoir",
        "examen",
        "controle",
        "universite",
        "haute ecole",
        "stage",
      ],
    },
    {
      positionLabels: ["sport", "gym", "fitness"],
      keywords: [
        "sport",
        "gym",
        "fitness",
        "foot",
        "football",
        "basket",
        "natation",
        "piscine",
        "danse",
        "entrainement",
      ],
    },
    {
      positionLabels: ["maison", "domicile", "home"],
      keywords: [
        "maison",
        "domicile",
        "home",
        "famille",
        "repos",
        "dodo",
        "sleep",
      ],
    },
    {
      positionLabels: ["courses", "magasin", "shopping"],
      keywords: [
        "courses",
        "magasin",
        "shopping",
        "supermarche",
        "carrefour",
        "delhaize",
        "aldi",
        "lidl",
        "colruyt",
      ],
    },
    {
      positionLabels: ["sante", "santé", "medecin", "médecin", "docteur"],
      keywords: [
        "medecin",
        "docteur",
        "dentiste",
        "hopital",
        "hôpital",
        "rdv medical",
        "rendez vous medical",
        "pharmacie",
        "kine",
        "kiné",
      ],
    },
    {
      positionLabels: ["dehors", "sortie", "extérieur", "exterieur"],
      keywords: [
        "sortie",
        "dehors",
        "exterieur",
        "extérieur",
        "balade",
        "promenade",
        "parc",
      ],
    },
  ];

  for (const rule of keywordRules) {
    const titleMatchesKeyword = rule.keywords.some((keyword) => {
      return normalizedTitle.includes(normalizeText(keyword));
    });

    if (!titleMatchesKeyword) {
      continue;
    }

    const matchedPosition = findPositionByPossibleLabels(
      positions,
      rule.positionLabels
    );

    if (matchedPosition) {
      return matchedPosition.id;
    }
  }

  return defaultPositionId;
};

const findOverlappingRules = async ({
  memberId,
  dayOfWeek,
  startTime,
  endTime,
}) => {
  const rules = await all(
    `
      SELECT *
      FROM schedule_rules
      WHERE member_id = ?
        AND day_of_week = ?
        AND COALESCE(is_active, 1) = 1
        AND COALESCE(conflict_status, 'none') != 'ignored'
    `,
    [memberId, dayOfWeek]
  );

  return rules.filter((rule) => {
    return hasOverlap(startTime, endTime, rule.start_time, rule.end_time);
  });
};

const recalculateConflictsForMember = async (memberId) => {
  const now = new Date().toISOString();

  const rules = await all(
    `
      SELECT *
      FROM schedule_rules
      WHERE member_id = ?
        AND COALESCE(is_active, 1) = 1
      ORDER BY day_of_week, start_time
    `,
    [memberId]
  );

  await run(
    `
      UPDATE schedule_rules
      SET conflict_status = 'none',
          conflict_with_id = NULL,
          updated_at = ?
      WHERE member_id = ?
        AND COALESCE(is_active, 1) = 1
    `,
    [now, memberId]
  );

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i];
      const ruleB = rules[j];

      if (Number(ruleA.day_of_week) !== Number(ruleB.day_of_week)) {
        continue;
      }

      const overlap = hasOverlap(
        ruleA.start_time,
        ruleA.end_time,
        ruleB.start_time,
        ruleB.end_time
      );

      if (!overlap) {
        continue;
      }

      const priorityA = getSourcePriority(ruleA.source || "manual");
      const priorityB = getSourcePriority(ruleB.source || "manual");

      if (priorityA > priorityB) {
        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'conflict',
                conflict_with_id = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [ruleA.id, now, ruleB.id]
        );
      } else if (priorityB > priorityA) {
        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'conflict',
                conflict_with_id = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [ruleB.id, now, ruleA.id]
        );
      } else {
        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'conflict',
                conflict_with_id = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [ruleB.id, now, ruleA.id]
        );

        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'conflict',
                conflict_with_id = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [ruleA.id, now, ruleB.id]
        );
      }
    }
  }

  const result = await get(
    `
      SELECT COUNT(*) AS count
      FROM schedule_rules
      WHERE member_id = ?
        AND COALESCE(is_active, 1) = 1
        AND conflict_status = 'conflict'
    `,
    [memberId]
  );

  return result?.count || 0;
};

const deactivateDeletedExternalEvents = async ({
  familyId,
  memberId,
  provider,
  currentExternalEventIds,
}) => {
  const now = new Date().toISOString();

  if (currentExternalEventIds.length > 0) {
    const placeholders = currentExternalEventIds.map(() => "?").join(",");

    const result = await run(
      `
        UPDATE schedule_rules
        SET is_active = 0,
            conflict_status = CASE
              WHEN conflict_status = 'conflict' THEN 'ignored'
              ELSE conflict_status
            END,
            updated_at = ?
        WHERE family_id = ?
          AND member_id = ?
          AND provider = ?
          AND source = ?
          AND external_event_id IS NOT NULL
          AND COALESCE(is_active, 1) = 1
          AND external_event_id NOT IN (${placeholders})
      `,
      [
        now,
        familyId,
        memberId,
        provider,
        provider,
        ...currentExternalEventIds,
      ]
    );

    return result.changes || 0;
  }

  const result = await run(
    `
      UPDATE schedule_rules
      SET is_active = 0,
          conflict_status = CASE
            WHEN conflict_status = 'conflict' THEN 'ignored'
            ELSE conflict_status
          END,
          updated_at = ?
      WHERE family_id = ?
        AND member_id = ?
        AND provider = ?
        AND source = ?
        AND external_event_id IS NOT NULL
        AND COALESCE(is_active, 1) = 1
    `,
    [now, familyId, memberId, provider, provider]
  );

  return result.changes || 0;
};

const importCalendarEventsIntoSchedule = async ({
  familyId,
  memberId,
  positionId,
  provider,
  events,
}) => {
  await ensureScheduleSchema();

  const positions = await getClockPositionsByFamily(familyId);

  const currentExternalEventIds = events
    .map((event) => event.externalEventId)
    .filter(Boolean);

  const deleted = await deactivateDeletedExternalEvents({
    familyId,
    memberId,
    provider,
    currentExternalEventIds,
  });

  let imported = 0;
  let skipped = 0;
  let updated = 0;

  for (const event of events) {
    const externalEventId = event.externalEventId;
    const eventTitle = event.title || "Événement calendrier";

    if (!externalEventId) {
      skipped += 1;
      continue;
    }

    const dayOfWeek = toDayOfWeek(event.startDateTime);
    const startTime = toTime(event.startDateTime);
    const endTime = toTime(event.endDateTime);

    if (!startTime || !endTime || startTime >= endTime) {
      skipped += 1;
      continue;
    }

    const detectedPositionId = detectPositionFromEventTitle({
      eventTitle,
      positions,
      defaultPositionId: positionId,
    });

    const finalPositionId = detectedPositionId || positionId;

    const existing = await get(
      `
        SELECT *
        FROM schedule_rules
        WHERE family_id = ?
          AND member_id = ?
          AND provider = ?
          AND external_event_id = ?
      `,
      [familyId, memberId, provider, externalEventId]
    );

    if (existing) {
      await run(
        `
          UPDATE schedule_rules
          SET title = ?,
              day_of_week = ?,
              start_time = ?,
              end_time = ?,
              position_id = ?,
              is_active = 1,
              updated_at = ?
          WHERE id = ?
        `,
        [
          eventTitle,
          dayOfWeek,
          startTime,
          endTime,
          finalPositionId,
          new Date().toISOString(),
          existing.id,
        ]
      );

      updated += 1;
      continue;
    }

    const overlappingRules = await findOverlappingRules({
      memberId,
      dayOfWeek,
      startTime,
      endTime,
    });

    const conflictStatus = overlappingRules.length > 0 ? "conflict" : "none";
    const conflictWithId = overlappingRules[0]?.id || null;

    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      `
        INSERT INTO schedule_rules (
          id,
          family_id,
          member_id,
          day_of_week,
          start_time,
          end_time,
          position_id,
          title,
          source,
          planning_mode,
          provider,
          external_event_id,
          conflict_status,
          conflict_with_id,
          conflict_resolution,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        familyId,
        memberId,
        dayOfWeek,
        startTime,
        endTime,
        finalPositionId,
        eventTitle,
        provider,
        "hybrid",
        provider,
        externalEventId,
        conflictStatus,
        conflictWithId,
        null,
        1,
        now,
        now,
      ]
    );

    imported += 1;
  }

  const conflicts = await recalculateConflictsForMember(memberId);

  return {
    imported,
    skipped,
    updated,
    deleted,
    conflicts,
  };
};

module.exports = {
  importCalendarEventsIntoSchedule,
};