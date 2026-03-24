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

const updateClockPositionLabel = (req, res) => {
  const { id } = req.params;
  const { label } = req.body;

  if (!label || !label.trim()) {
    return res.status(400).json({
      success: false,
      message: "Le nom du lieu est obligatoire",
    });
  }

  const trimmedLabel = label.trim();

  const getPositionQuery = `
    SELECT id, family_id, position_number
    FROM clock_positions
    WHERE id = ?
  `;

  db.get(getPositionQuery, [id], (getErr, positionRow) => {
    if (getErr) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification de la position",
      });
    }

    if (!positionRow) {
      return res.status(404).json({
        success: false,
        message: "Emplacement introuvable",
      });
    }

    const checkDuplicateQuery = `
      SELECT id
      FROM clock_positions
      WHERE family_id = ?
        AND LOWER(label) = LOWER(?)
        AND id != ?
    `;

    db.get(
      checkDuplicateQuery,
      [positionRow.family_id, trimmedLabel, id],
      (dupErr, dupRow) => {
        if (dupErr) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la vérification du doublon",
          });
        }

        if (dupRow) {
          return res.status(400).json({
            success: false,
            message:
              "Ce lieu existe déjà sur le cadran. Utilisez la réorganisation pour le déplacer.",
          });
        }

        const updateQuery = `
          UPDATE clock_positions
          SET label = ?
          WHERE id = ?
        `;

        db.run(updateQuery, [trimmedLabel, id], function (updateErr) {
          if (updateErr) {
            return res.status(500).json({
              success: false,
              message: "Erreur lors de la mise à jour du lieu",
            });
          }

          return res.status(200).json({
            success: true,
            message: "Lieu mis à jour avec succès",
            data: {
              id,
              label: trimmedLabel,
            },
          });
        });
      }
    );
  });
};

const reorderClockPositions = (req, res) => {
  const { familyId, sourcePosition, targetPosition } = req.body;

  if (!familyId) {
    return res.status(400).json({
      success: false,
      message: "familyId est obligatoire",
    });
  }

  if (
    typeof sourcePosition !== "number" ||
    typeof targetPosition !== "number"
  ) {
    return res.status(400).json({
      success: false,
      message: "sourcePosition et targetPosition doivent être des nombres",
    });
  }

  if (sourcePosition === targetPosition) {
    return res.status(400).json({
      success: false,
      message: "Les deux positions doivent être différentes",
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

      const getPositionsQuery = `
        SELECT id, family_id, position_number, label, angle
        FROM clock_positions
        WHERE family_id = ?
          AND position_number IN (?, ?)
        ORDER BY position_number ASC
      `;

      db.all(
        getPositionsQuery,
        [familyId, sourcePosition, targetPosition],
        (getErr, rows) => {
          if (getErr) {
            return res.status(500).json({
              success: false,
              message: "Erreur lors de la récupération des positions",
            });
          }

          if (!rows || rows.length !== 2) {
            return res.status(404).json({
              success: false,
              message: "Une ou plusieurs positions sont introuvables",
            });
          }

          const sourceRow = rows.find(
            (row) => row.position_number === sourcePosition
          );
          const targetRow = rows.find(
            (row) => row.position_number === targetPosition
          );

          if (!sourceRow || !targetRow) {
            return res.status(404).json({
              success: false,
              message: "Impossible de retrouver les positions à échanger",
            });
          }

          const updateQuery = `
            UPDATE clock_positions
            SET label = ?
            WHERE family_id = ? AND position_number = ?
          `;

          db.run(
            updateQuery,
            [targetRow.label, familyId, sourcePosition],
            function (firstUpdateErr) {
              if (firstUpdateErr) {
                return res.status(500).json({
                  success: false,
                  message: "Erreur lors de la mise à jour de la première position",
                });
              }

              db.run(
                updateQuery,
                [sourceRow.label, familyId, targetPosition],
                function (secondUpdateErr) {
                  if (secondUpdateErr) {
                    return res.status(500).json({
                      success: false,
                      message:
                        "Erreur lors de la mise à jour de la deuxième position",
                    });
                  }

                  return res.status(200).json({
                    success: true,
                    message: "Emplacements réorganisés avec succès",
                    data: {
                      familyId,
                      sourcePosition,
                      targetPosition,
                      updatedPositions: [
                        {
                          positionNumber: sourcePosition,
                          label: targetRow.label,
                        },
                        {
                          positionNumber: targetPosition,
                          label: sourceRow.label,
                        },
                      ],
                    },
                  });
                }
              );
            }
          );
        }
      );
    });
  });
};

module.exports = {
  getClockPositionsByFamily,
  updateClockPositionLabel,
  reorderClockPositions,
};