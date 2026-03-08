const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

/*
------------------------------------------------
Créer un membre
- attribution automatique du premier servo libre
------------------------------------------------
*/
const createMember = (req, res) => {
  const { familyId, name, role } = req.body;

  if (!familyId || !name || !role) {
    return res.status(400).json({
      success: false,
      message: "familyId, name et role sont obligatoires",
    });
  }

  const trimmedName = name.trim();
  const trimmedRole = role.trim();

  if (!trimmedName) {
    return res.status(400).json({
      success: false,
      message: "Le nom est obligatoire",
    });
  }

  if (!trimmedRole) {
    return res.status(400).json({
      success: false,
      message: "Le rôle est obligatoire",
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

    const getUsedServosQuery = `
      SELECT servo_channel
      FROM members
      WHERE family_id = ?
      ORDER BY servo_channel ASC
    `;

    db.all(getUsedServosQuery, [familyId], (servoErr, rows) => {
      if (servoErr) {
        return res.status(500).json({
          success: false,
          message: "Erreur serveur lors de la recherche des servos utilisés",
        });
      }

      const usedChannels = rows.map((row) => row.servo_channel);

      let availableServo = null;
      const MAX_SERVOS = 16;

      for (let i = 0; i < MAX_SERVOS; i++) {
        if (!usedChannels.includes(i)) {
          availableServo = i;
          break;
        }
      }

      if (availableServo === null) {
        return res.status(400).json({
          success: false,
          message: "Aucune aiguille disponible pour cette famille",
        });
      }

      const newMember = {
        id: uuidv4(),
        family_id: familyId,
        name: trimmedName,
        role: trimmedRole,
        servo_channel: availableServo,
        created_at: new Date().toISOString(),
      };

      const insertMemberQuery = `
        INSERT INTO members (id, family_id, name, role, servo_channel, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(
        insertMemberQuery,
        [
          newMember.id,
          newMember.family_id,
          newMember.name,
          newMember.role,
          newMember.servo_channel,
          newMember.created_at,
        ],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({
              success: false,
              message: "Erreur serveur lors de la création du membre",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Membre créé avec succès",
            data: {
              id: newMember.id,
              familyId: newMember.family_id,
              name: newMember.name,
              role: newMember.role,
              servoChannel: newMember.servo_channel,
              createdAt: newMember.created_at,
            },
          });
        }
      );
    });
  });
};

/*
------------------------------------------------
Lister les membres d'une famille
------------------------------------------------
*/
const getMembersByFamily = (req, res) => {
  const { familyId } = req.params;

  if (!familyId) {
    return res.status(400).json({
      success: false,
      message: "familyId est obligatoire",
    });
  }

  const query = `
    SELECT id, family_id, name, role, servo_channel, created_at
    FROM members
    WHERE family_id = ?
    ORDER BY servo_channel ASC
  `;

  db.all(query, [familyId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des membres",
      });
    }

    const members = rows.map((member) => ({
      id: member.id,
      familyId: member.family_id,
      name: member.name,
      role: member.role,
      servoChannel: member.servo_channel,
      createdAt: member.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: members,
    });
  });
};

/*
------------------------------------------------
Récupérer un membre par id
------------------------------------------------
*/
const getMemberById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT id, family_id, name, role, servo_channel, created_at
    FROM members
    WHERE id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération du membre",
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: row.id,
        familyId: row.family_id,
        name: row.name,
        role: row.role,
        servoChannel: row.servo_channel,
        createdAt: row.created_at,
      },
    });
  });
};

/*
------------------------------------------------
Modifier un membre
- nom modifiable
- rôle modifiable
- servo/aiguille modifiable
- interdiction de prendre un servo déjà utilisé
------------------------------------------------
*/
const updateMember = (req, res) => {
  const { id } = req.params;
  const { name, role, servoChannel } = req.body;

  if (!name || !role || servoChannel === undefined || servoChannel === null) {
    return res.status(400).json({
      success: false,
      message: "Nom, rôle et aiguille sont obligatoires",
    });
  }

  const trimmedName = name.trim();
  const trimmedRole = role.trim();
  const parsedServoChannel = Number(servoChannel);

  if (!trimmedName) {
    return res.status(400).json({
      success: false,
      message: "Le nom est obligatoire",
    });
  }

  if (!trimmedRole) {
    return res.status(400).json({
      success: false,
      message: "Le rôle est obligatoire",
    });
  }

  if (!Number.isInteger(parsedServoChannel) || parsedServoChannel < 0 || parsedServoChannel > 15) {
    return res.status(400).json({
      success: false,
      message: "L’aiguille sélectionnée est invalide",
    });
  }

  const getMemberQuery = `
    SELECT id, family_id
    FROM members
    WHERE id = ?
  `;

  db.get(getMemberQuery, [id], (memberErr, memberRow) => {
    if (memberErr) {
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la vérification du membre",
      });
    }

    if (!memberRow) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
      });
    }

    const checkServoConflictQuery = `
      SELECT id
      FROM members
      WHERE family_id = ?
        AND servo_channel = ?
        AND id != ?
    `;

    db.get(
      checkServoConflictQuery,
      [memberRow.family_id, parsedServoChannel, id],
      (conflictErr, conflictRow) => {
        if (conflictErr) {
          return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la vérification de l’aiguille",
          });
        }

        if (conflictRow) {
          return res.status(400).json({
            success: false,
            message: "Cette aiguille est déjà attribuée à un autre membre",
          });
        }

        const updateQuery = `
          UPDATE members
          SET name = ?, role = ?, servo_channel = ?
          WHERE id = ?
        `;

        db.run(
          updateQuery,
          [trimmedName, trimmedRole, parsedServoChannel, id],
          function (updateErr) {
            if (updateErr) {
              return res.status(500).json({
                success: false,
                message: "Erreur lors de la modification du membre",
              });
            }

            if (this.changes === 0) {
              return res.status(404).json({
                success: false,
                message: "Membre introuvable",
              });
            }

            return res.status(200).json({
              success: true,
              message: "Membre modifié avec succès",
            });
          }
        );
      }
    );
  });
};

module.exports = {
  createMember,
  getMembersByFamily,
  getMemberById,
  updateMember,
};