const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

//
// ✅ US-4.1 — créer une règle horaire
//
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

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const sql = `
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
    sql,
    [id, familyId, memberId, dayOfWeek, startTime, endTime, positionId, createdAt],
    function (err) {
      if (err) {
        console.error("Erreur création règle :", err.message);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Règle créée",
        ruleId: id,
      });
    }
  );
};

//
// ✅ US-4.4 — récupérer le planning d’un membre
//
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