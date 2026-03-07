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

    const familyId = uuidv4();
    const pinHash = await bcrypt.hash(pin, 10);
    const createdAt = new Date().toISOString();

    const query = `
      INSERT INTO families (id, family_name, pin_hash, created_at)
      VALUES (?, ?, ?, ?)
    `;

    db.run(query, [familyId, familyName, pinHash, createdAt], function (err) {
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
          familyName,
          createdAt
        }
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

module.exports = {
  createFamily
};