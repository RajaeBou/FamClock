const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const VALID_SOURCES = ["manual", "google", "outlook"];
const VALID_PLANNING_MODES = ["manual_only", "external_only", "hybrid"];
const VALID_PROVIDERS = ["none", "google", "outlook"];

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

const normalizeTime = (value) => {
  if (!value) return null;

  const text = String(value).trim();

  if (/^\d{2}:\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{1}:\d{2}$/.test(text)) {
    return `0${text}`;
  }

  return text;
};

const isValidTime = (value) => {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
};

const hasOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

const getSourcePriority = (source) => {
  if (source === "manual") return 2;
  if (source === "google" || source === "outlook") return 1;
  return 0;
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

  await run(`
    CREATE TABLE IF NOT EXISTS planning_settings (
      family_id TEXT PRIMARY KEY,
      planning_mode TEXT NOT NULL DEFAULT 'manual_only',
      provider TEXT NOT NULL DEFAULT 'none',
      sync_enabled INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
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

const findOverlappingRules = async ({
  memberId,
  dayOfWeek,
  startTime,
  endTime,
}) => {
  const rows = await all(
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

  return rows.filter((rule) => {
    return hasOverlap(
      startTime,
      endTime,
      normalizeTime(rule.start_time),
      normalizeTime(rule.end_time)
    );
  });
};

const createScheduleRule = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const {
      familyId,
      memberId,
      dayOfWeek,
      startTime,
      endTime,
      positionId,
      title,
      source = "manual",
      planningMode = "manual_only",
      provider,
      externalEventId,
    } = req.body;

    const finalStartTime = normalizeTime(startTime);
    const finalEndTime = normalizeTime(endTime);
    const finalSource = source || "manual";
    const finalPlanningMode = planningMode || "manual_only";
    const finalProvider =
      provider || (finalSource === "manual" ? "none" : finalSource);

    if (
      !familyId ||
      !memberId ||
      dayOfWeek === undefined ||
      !finalStartTime ||
      !finalEndTime ||
      !positionId
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont obligatoires",
      });
    }

    if (!isValidTime(finalStartTime) || !isValidTime(finalEndTime)) {
      return res.status(400).json({
        success: false,
        message: "Les heures doivent être au format HH:mm",
      });
    }

    if (finalStartTime >= finalEndTime) {
      return res.status(400).json({
        success: false,
        message: "L'heure de début doit être inférieure à l'heure de fin",
      });
    }

    if (Number(dayOfWeek) < 0 || Number(dayOfWeek) > 6) {
      return res.status(400).json({
        success: false,
        message: "Le jour de la semaine doit être compris entre 0 et 6",
      });
    }

    if (!VALID_SOURCES.includes(finalSource)) {
      return res.status(400).json({
        success: false,
        message: "Source invalide. Valeurs acceptées : manual, google, outlook",
      });
    }

    if (!VALID_PLANNING_MODES.includes(finalPlanningMode)) {
      return res.status(400).json({
        success: false,
        message:
          "Mode invalide. Valeurs acceptées : manual_only, external_only, hybrid",
      });
    }

    if (!VALID_PROVIDERS.includes(finalProvider)) {
      return res.status(400).json({
        success: false,
        message: "Provider invalide. Valeurs acceptées : none, google, outlook",
      });
    }

    if (finalPlanningMode === "manual_only" && finalSource !== "manual") {
      return res.status(400).json({
        success: false,
        message:
          "Le mode manuel uniquement n'accepte pas les événements Google ou Outlook",
      });
    }

    if (
      finalPlanningMode === "external_only" &&
      !["google", "outlook"].includes(finalSource)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le mode calendrier externe uniquement accepte seulement Google ou Outlook",
      });
    }

    const overlappingRules = await findOverlappingRules({
      memberId,
      dayOfWeek,
      startTime: finalStartTime,
      endTime: finalEndTime,
    });

    const manualOverlap = overlappingRules.find((rule) => {
      return (rule.source || "manual") === "manual";
    });

    if (finalSource === "manual" && manualOverlap) {
      return res.status(400).json({
        success: false,
        message: "Conflit : une règle manuelle existe déjà sur ce créneau",
        conflict: manualOverlap,
      });
    }

    let conflictStatus = "none";
    let conflictWithId = null;

    if (finalSource !== "manual" && overlappingRules.length > 0) {
      conflictStatus = "conflict";
      conflictWithId = overlappingRules[0].id;
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

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
        Number(dayOfWeek),
        finalStartTime,
        finalEndTime,
        positionId,
        title || null,
        finalSource,
        finalPlanningMode,
        finalProvider,
        externalEventId || null,
        conflictStatus,
        conflictWithId,
        null,
        1,
        createdAt,
        createdAt,
      ]
    );

    if (finalSource === "manual" && overlappingRules.length > 0) {
      const externalConflicts = overlappingRules.filter((rule) => {
        return ["google", "outlook"].includes(rule.source);
      });

      for (const rule of externalConflicts) {
        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'conflict',
                conflict_with_id = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [id, createdAt, rule.id]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message:
        conflictStatus === "conflict"
          ? "Règle créée avec un conflit à vérifier"
          : "Règle créée",
      ruleId: id,
      conflictStatus,
      conflictWithId,
      conflicts: overlappingRules,
    });
  } catch (err) {
    console.error("Erreur SQL création règle :", err.message);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getScheduleRulesByMember = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { memberId } = req.params;

    const sql = `
      SELECT 
        sr.id,
        sr.family_id,
        sr.member_id,
        sr.day_of_week,
        sr.start_time,
        sr.end_time,
        sr.position_id,
        sr.title,
        sr.source,
        sr.planning_mode,
        sr.provider,
        sr.external_event_id,
        sr.conflict_status,
        sr.conflict_with_id,
        sr.conflict_resolution,
        sr.is_active,
        sr.created_at,
        sr.updated_at,
        cp.label AS position_label,
        cp.angle AS position_angle
      FROM schedule_rules sr
      LEFT JOIN clock_positions cp ON cp.id = sr.position_id
      WHERE sr.member_id = ?
        AND COALESCE(sr.is_active, 1) = 1
      ORDER BY sr.day_of_week, sr.start_time
    `;

    const rows = await all(sql, [memberId]);

    return res.json({
      success: true,
      rules: rows,
    });
  } catch (err) {
    console.error("Erreur récupération planning :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération planning",
    });
  }
};

const getActiveScheduleRule = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { memberId } = req.params;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const sql = `
      SELECT 
        sr.id,
        sr.family_id,
        sr.member_id,
        sr.day_of_week,
        sr.start_time,
        sr.end_time,
        sr.position_id,
        sr.title,
        sr.source,
        sr.planning_mode,
        sr.provider,
        sr.external_event_id,
        sr.conflict_status,
        sr.conflict_with_id,
        sr.conflict_resolution,
        sr.is_active,
        cp.label AS position_label,
        cp.angle AS position_angle
      FROM schedule_rules sr
      LEFT JOIN clock_positions cp ON cp.id = sr.position_id
      WHERE sr.member_id = ?
        AND sr.day_of_week = ?
        AND sr.start_time <= ?
        AND sr.end_time > ?
        AND COALESCE(sr.is_active, 1) = 1
        AND COALESCE(sr.conflict_status, 'none') != 'ignored'
    `;

    const rows = await all(sql, [
      memberId,
      dayOfWeek,
      currentTime,
      currentTime,
    ]);

    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        activeRule: null,
        message: "Aucune règle active",
      });
    }

    const sortedRows = rows.sort((a, b) => {
      const priorityA = getSourcePriority(a.source || "manual");
      const priorityB = getSourcePriority(b.source || "manual");

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      if (a.conflict_status === "none" && b.conflict_status !== "none") {
        return -1;
      }

      if (a.conflict_status !== "none" && b.conflict_status === "none") {
        return 1;
      }

      return String(b.start_time).localeCompare(String(a.start_time));
    });

    return res.json({
      success: true,
      activeRule: sortedRows[0],
      conflictingRules: sortedRows.slice(1),
    });
  } catch (err) {
    console.error("Erreur récupération règle active :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération règle active",
    });
  }
};

const getPlanningSettings = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { familyId } = req.params;

    let settings = await get(
      `
        SELECT *
        FROM planning_settings
        WHERE family_id = ?
      `,
      [familyId]
    );

    if (!settings) {
      const now = new Date().toISOString();

      await run(
        `
          INSERT INTO planning_settings (
            family_id,
            planning_mode,
            provider,
            sync_enabled,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [familyId, "manual_only", "none", 0, now, now]
      );

      settings = await get(
        `
          SELECT *
          FROM planning_settings
          WHERE family_id = ?
        `,
        [familyId]
      );
    }

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("Erreur récupération paramètres planning :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération paramètres planning",
    });
  }
};

const updatePlanningSettings = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { familyId } = req.params;
    const {
      planningMode = "manual_only",
      provider = "none",
      syncEnabled = false,
    } = req.body;

    if (!VALID_PLANNING_MODES.includes(planningMode)) {
      return res.status(400).json({
        success: false,
        message:
          "Mode invalide. Valeurs acceptées : manual_only, external_only, hybrid",
      });
    }

    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Provider invalide. Valeurs acceptées : none, google, outlook",
      });
    }

    if (planningMode === "manual_only" && provider !== "none") {
      return res.status(400).json({
        success: false,
        message: "En mode manuel uniquement, le provider doit être none",
      });
    }

    if (["external_only", "hybrid"].includes(planningMode) && provider === "none") {
      return res.status(400).json({
        success: false,
        message:
          "Pour utiliser un calendrier externe, il faut choisir google ou outlook",
      });
    }

    const now = new Date().toISOString();

    const existingSettings = await get(
      `
        SELECT *
        FROM planning_settings
        WHERE family_id = ?
      `,
      [familyId]
    );

    if (!existingSettings) {
      await run(
        `
          INSERT INTO planning_settings (
            family_id,
            planning_mode,
            provider,
            sync_enabled,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [familyId, planningMode, provider, syncEnabled ? 1 : 0, now, now]
      );
    } else {
      await run(
        `
          UPDATE planning_settings
          SET planning_mode = ?,
              provider = ?,
              sync_enabled = ?,
              updated_at = ?
          WHERE family_id = ?
        `,
        [planningMode, provider, syncEnabled ? 1 : 0, now, familyId]
      );
    }

    const updatedSettings = await get(
      `
        SELECT *
        FROM planning_settings
        WHERE family_id = ?
      `,
      [familyId]
    );

    return res.json({
      success: true,
      message: "Paramètres du planning mis à jour",
      settings: updatedSettings,
    });
  } catch (err) {
    console.error("Erreur mise à jour paramètres planning :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur mise à jour paramètres planning",
    });
  }
};

const getScheduleConflictsByMember = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { memberId } = req.params;

    const conflicts = await all(
      `
        SELECT 
          sr.id,
          sr.family_id,
          sr.member_id,
          sr.day_of_week,
          sr.start_time,
          sr.end_time,
          sr.position_id,
          sr.title,
          sr.source,
          sr.planning_mode,
          sr.provider,
          sr.external_event_id,
          sr.conflict_status,
          sr.conflict_with_id,
          sr.conflict_resolution,
          cp.label AS position_label,
          cp.angle AS position_angle
        FROM schedule_rules sr
        LEFT JOIN clock_positions cp ON cp.id = sr.position_id
        WHERE sr.member_id = ?
          AND COALESCE(sr.is_active, 1) = 1
          AND sr.conflict_status = 'conflict'
        ORDER BY sr.day_of_week, sr.start_time
      `,
      [memberId]
    );

    return res.json({
      success: true,
      conflicts,
    });
  } catch (err) {
    console.error("Erreur récupération conflits :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération conflits",
    });
  }
};

const resolveScheduleConflict = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { ruleId } = req.params;
    const { action } = req.body;

    const validActions = [
      "keep_manual",
      "replace_with_external",
      "ignore_external",
      "mark_resolved",
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message:
          "Action invalide. Valeurs acceptées : keep_manual, replace_with_external, ignore_external, mark_resolved",
      });
    }

    const rule = await get(
      `
        SELECT *
        FROM schedule_rules
        WHERE id = ?
      `,
      [ruleId]
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Règle introuvable",
      });
    }

    const now = new Date().toISOString();

    if (action === "ignore_external") {
      await run(
        `
          UPDATE schedule_rules
          SET conflict_status = 'ignored',
              conflict_resolution = ?,
              is_active = 0,
              updated_at = ?
          WHERE id = ?
        `,
        [action, now, ruleId]
      );
    }

    if (action === "mark_resolved") {
      await run(
        `
          UPDATE schedule_rules
          SET conflict_status = 'resolved',
              conflict_resolution = ?,
              updated_at = ?
          WHERE id = ?
        `,
        [action, now, ruleId]
      );
    }

    if (action === "keep_manual") {
      if (rule.source === "manual") {
        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'resolved',
                conflict_resolution = ?,
                updated_at = ?
            WHERE id = ?
          `,
          [action, now, ruleId]
        );
      } else {
        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'ignored',
                conflict_resolution = ?,
                is_active = 0,
                updated_at = ?
            WHERE id = ?
          `,
          [action, now, ruleId]
        );
      }
    }

    if (action === "replace_with_external") {
      await run(
        `
          UPDATE schedule_rules
          SET conflict_status = 'resolved',
              conflict_resolution = ?,
              updated_at = ?
          WHERE id = ?
        `,
        [action, now, ruleId]
      );

      if (rule.conflict_with_id) {
        await run(
          `
            UPDATE schedule_rules
            SET conflict_status = 'ignored',
                conflict_resolution = ?,
                is_active = 0,
                updated_at = ?
            WHERE id = ?
          `,
          [action, now, rule.conflict_with_id]
        );
      }
    }

    const updatedRule = await get(
      `
        SELECT *
        FROM schedule_rules
        WHERE id = ?
      `,
      [ruleId]
    );

    return res.json({
      success: true,
      message: "Conflit mis à jour",
      rule: updatedRule,
    });
  } catch (err) {
    console.error("Erreur résolution conflit :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur résolution conflit",
    });
  }
};

const deleteScheduleRule = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { ruleId } = req.params;

    const rule = await get(
      `
        SELECT *
        FROM schedule_rules
        WHERE id = ?
      `,
      [ruleId]
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Règle introuvable",
      });
    }

    const now = new Date().toISOString();

    await run(
      `
        UPDATE schedule_rules
        SET is_active = 0,
            conflict_status = CASE
              WHEN conflict_status = 'conflict' THEN 'ignored'
              ELSE conflict_status
            END,
            updated_at = ?
        WHERE id = ?
      `,
      [now, ruleId]
    );

    await run(
      `
        UPDATE schedule_rules
        SET conflict_status = 'none',
            conflict_with_id = NULL,
            updated_at = ?
        WHERE conflict_with_id = ?
          AND COALESCE(is_active, 1) = 1
      `,
      [now, ruleId]
    );

    return res.json({
      success: true,
      message: "Règle supprimée",
    });
  } catch (err) {
    console.error("Erreur suppression règle :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la règle",
    });
  }
};

const keepScheduleRuleAndIgnoreConflicts = async (req, res) => {
  try {
    await ensureScheduleSchema();

    const { ruleId } = req.params;

    const selectedRule = await get(
      `
        SELECT *
        FROM schedule_rules
        WHERE id = ?
          AND COALESCE(is_active, 1) = 1
      `,
      [ruleId]
    );

    if (!selectedRule) {
      return res.status(404).json({
        success: false,
        message: "Règle introuvable",
      });
    }

    const overlappingRules = await all(
      `
        SELECT *
        FROM schedule_rules
        WHERE member_id = ?
          AND day_of_week = ?
          AND id != ?
          AND COALESCE(is_active, 1) = 1
          AND start_time < ?
          AND end_time > ?
      `,
      [
        selectedRule.member_id,
        selectedRule.day_of_week,
        selectedRule.id,
        selectedRule.end_time,
        selectedRule.start_time,
      ]
    );

    const now = new Date().toISOString();

    await run(
      `
        UPDATE schedule_rules
        SET conflict_status = 'resolved',
            conflict_resolution = 'kept_by_parent',
            conflict_with_id = NULL,
            updated_at = ?
        WHERE id = ?
      `,
      [now, selectedRule.id]
    );

    for (const rule of overlappingRules) {
      await run(
        `
          UPDATE schedule_rules
          SET is_active = 0,
              conflict_status = 'ignored',
              conflict_resolution = 'ignored_after_parent_choice',
              updated_at = ?
          WHERE id = ?
        `,
        [now, rule.id]
      );
    }

    return res.json({
      success: true,
      message: "Règle conservée et conflits ignorés",
      keptRuleId: selectedRule.id,
      ignoredRules: overlappingRules.length,
    });
  } catch (err) {
    console.error("Erreur gestion conflit :", err.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la gestion du conflit",
    });
  }
};

module.exports = {
  createScheduleRule,
  getScheduleRulesByMember,
  getActiveScheduleRule,
  getPlanningSettings,
  updatePlanningSettings,
  getScheduleConflictsByMember,
  resolveScheduleConflict,
  deleteScheduleRule,
  keepScheduleRuleAndIgnoreConflicts,
};