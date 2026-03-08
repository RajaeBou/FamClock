const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

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
          message: "Aucun servo disponible pour cette famille",
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

module.exports = {
  createMember,
  getMembersByFamily,
};