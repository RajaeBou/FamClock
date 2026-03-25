const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const createScheduleRule = (req, res) => {
  const {
    familyId,
    memberId,
    dayOfWeek,
    startTime,
    endTime,
    positionId,
  } = req.body;

  if (
    !familyId ||
    !memberId ||
    dayOfWeek === undefined ||
    !startTime ||
    !endTime ||
    !positionId
  ) {
    return res.status(400).json({
      success: false,
      message: "Tous les champs sont obligatoires",
    });
  }

  // ⭐ 1️⃣ vérifier chevauchement
  const overlapSql = `
    SELECT * FROM schedule_rules
    WHERE member_id = ?
    AND day_of_week = ?
    AND start_time < ?
    AND end_time > ?
  `;

  db.get(
    overlapSql,
    [memberId, dayOfWeek, endTime, startTime],
    (err, existingRule) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Erreur vérification chevauchement",
        });
      }

      if (existingRule) {
        return res.status(400).json({
          success: false,
          message: "Conflit : règle déjà existante sur ce créneau",
        });
      }

      // ⭐ 2️⃣ insertion normale
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      const insertSql = `
        INSERT INTO schedule_rules (
          id,
          family_id,
          member_id,
          day_of_week,
          start_time,
          end_time,
          position_id,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        insertSql,
        [
          id,
          familyId,
          memberId,
          dayOfWeek,
          startTime,
          endTime,
          positionId,
          createdAt,
        ],
        function (err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Erreur création règle",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Règle créée",
          });
        }
      );
    }
  );
};
//
// ✅ US-4.1 — créer une règle horaire
//ime, positionId, createdAt],ssage);
const getScheduleRulesByMember = (req, res) => {
  const { memberId } = req.params;

  const sql = `
    SELECT 
      sr.id,
      sr.day_of_week,
      sr.start_time,
      sr.end_time,
      cp.label AS position_label
    FROM schedule_rules sr
    JOIN clock_positions cp ON cp.id = sr.position_id
    WHERE sr.member_id = ?
    ORDER BY sr.day_of_week, sr.start_time
  `;

  db.all(sql, [memberId], (err, rows) => {
    if (err) {
      console.error("Erreur récupération planning :", err.message);
      return res.status(500).json({
        success: false,
        message: "Erreur récupération planning",
      });
    }

    return res.json({
      success: true,
      rules: rows,
    });
  });
};

module.exports = {
  createScheduleRule,
  getScheduleRulesByMember,
};