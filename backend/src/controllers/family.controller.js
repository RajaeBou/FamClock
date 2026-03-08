const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const createFamily = async (req, res) => {
  try {
    const { familyName, pin } = req.body;

    if (!familyName || !pin) {
      return res.status(400).json({
        success: false,
        message: "familyName et pin sont obligatoires"
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "Le PIN doit contenir exactement 4 chiffres"
      });
    }

    const normalizedFamilyName = familyName.trim();

    const checkQuery = `
      SELECT id
      FROM families
      WHERE family_name = ?
    `;

    db.get(checkQuery, [normalizedFamilyName], async (checkErr, existingFamily) => {
      if (checkErr) {
        console.error("Erreur vérification famille existante :", checkErr.message);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur"
        });
      }

      if (existingFamily) {
        return res.status(409).json({
          success: false,
          message: "Une famille avec ce nom existe déjà"
        });
      }

      const familyId = uuidv4();
      const pinHash = await bcrypt.hash(pin, 10);
      const createdAt = new Date().toISOString();

      const insertQuery = `
        INSERT INTO families (id, family_name, pin_hash, created_at)
        VALUES (?, ?, ?, ?)
      `;

      db.run(insertQuery, [familyId, normalizedFamilyName, pinHash, createdAt], function (err) {
        if (err) {
          console.error("Erreur insertion famille :", err.message);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la création de la famille"
          });
        }

        return res.status(201).json({
          success: true,
          message: "Famille créée avec succès",
          data: {
            id: familyId,
            familyName: normalizedFamilyName,
            createdAt
          }
        });
      });
    });
  } catch (error) {
    console.error("Erreur createFamily :", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

const loginFamily = (req, res) => {
  try {
    const { familyName, pin } = req.body;

    if (!familyName || !pin) {
      return res.status(400).json({
        success: false,
        message: "familyName et pin sont obligatoires"
      });
    }

    const normalizedFamilyName = familyName.trim();

    const query = `
      SELECT id, family_name, pin_hash, created_at
      FROM families
      WHERE family_name = ?
    `;

    db.get(query, [normalizedFamilyName], async (err, family) => {
      if (err) {
        console.error("Erreur recherche famille :", err.message);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur"
        });
      }

      if (!family) {
        return res.status(404).json({
          success: false,
          message: "Famille introuvable"
        });
      }

      const isPinValid = await bcrypt.compare(pin, family.pin_hash);

      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: "PIN incorrect"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data: {
          id: family.id,
          familyName: family.family_name,
          createdAt: family.created_at
        }
      });
    });
  } catch (error) {
    console.error("Erreur loginFamily :", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

module.exports = {
  createFamily,
  loginFamily
};