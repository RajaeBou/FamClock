const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const DEFAULT_POSITIONS = [
  { positionNumber: 1, label: "Maison", angle: 0 },
  { positionNumber: 2, label: "École", angle: 45 },
  { positionNumber: 3, label: "Travail", angle: 90 },
  { positionNumber: 4, label: "Sport", angle: 135 },
  { positionNumber: 5, label: "Activité", angle: 180 },
  { positionNumber: 6, label: "Autre", angle: 225 },
  { positionNumber: 7, label: "Libre", angle: 270 },
  { positionNumber: 8, label: "Libre", angle: 315 },
];

const ensureDefaultPositionsForFamily = (familyId, callback) => {
  const countQuery = `
    SELECT COUNT(*) AS count
    FROM clock_positions
    WHERE family_id = ?
  `;

  db.get(countQuery, [familyId], (countErr, countRow) => {
    if (countErr) {
      return callback(countErr);
    }

    if (countRow.count > 0) {
      return callback(null);
    }

    const insertQuery = `
      INSERT INTO clock_positions (id, family_id, position_number, label, angle, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    let completed = 0;
    let hasError = false;

    DEFAULT_POSITIONS.forEach((position) => {
      db.run(
        insertQuery,
        [
          uuidv4(),
          familyId,
          position.positionNumber,
          position.label,
          position.angle,
          new Date().toISOString(),
        ],
        (insertErr) => {
          if (hasError) return;

          if (insertErr) {
            hasError = true;
            return callback(insertErr);
          }

          completed += 1;

          if (completed === DEFAULT_POSITIONS.length) {
            return callback(null);
          }
        }
      );
    });
  });
};

const getClockPositionsByFamily = (req, res) => {
  const { familyId } = req.params;

  if (!familyId) {
    return res.status(400).json({
      success: false,
      message: "familyId est obligatoire",
    });
  }

  const checkFamilyQuery = `
    SELECT id
    FROM families
    WHERE id = ?
  `;

  db.get(checkFamilyQuery, [familyId], (familyErr, familyRow) => {
    if (familyErr) {
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la vérification de la famille",
      });
    }

    if (!familyRow) {
      return res.status(404).json({
        success: false,
        message: "Famille introuvable",
      });
    }

    ensureDefaultPositionsForFamily(familyId, (ensureErr) => {
      if (ensureErr) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'initialisation des positions",
        });
      }

      const query = `
        SELECT id, family_id, position_number, label, angle, created_at
        FROM clock_positions
        WHERE family_id = ?
        ORDER BY position_number ASC
      `;

      db.all(query, [familyId], (err, rows) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des positions",
          });
        }

        const positions = rows.map((row) => ({
          id: row.id,
          familyId: row.family_id,
          positionNumber: row.position_number,
          label: row.label,
          angle: row.angle,
          createdAt: row.created_at,
        }));

        return res.status(200).json({
          success: true,
          data: positions,
        });
      });
    });
  });
};

module.exports = {
  getClockPositionsByFamily,
};