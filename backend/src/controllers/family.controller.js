const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const {
  registerFailedPinAttempt,
  resetPinAttempts,
} = require("../middlewares/pinAttemptLimiter");

const normalizeFamilyName = (familyName) => {
  return String(familyName || "").trim().toLowerCase();
};

const normalizePin = (pin) => {
  return String(pin || "").trim();
};

const isValidPin = (pin) => {
  const value = normalizePin(pin);

  const hasMinLength = value.length >= 12;
  const hasMaxLength = value.length <= 128;
  const hasLetter = /[A-Za-zÀ-ÿ]/.test(value);
  const hasNumber = /\d/.test(value);

  return hasMinLength && hasMaxLength && hasLetter && hasNumber;
};

const createFamily = async (req, res) => {
  try {
    const familyName = normalizeFamilyName(req.body.familyName);
    const pin = normalizePin(req.body.pin);

    if (!familyName || !pin) {
      return res.status(400).json({
        success: false,
        message: "familyName et mot de passe familial sont obligatoires",
      });
    }

    if (!isValidPin(pin)) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe familial doit contenir au moins 12 caractères, avec au moins une lettre et un chiffre.",
      });
    }

    const checkQuery = `
      SELECT id
      FROM families
      WHERE family_name = ?
    `;

    db.get(checkQuery, [familyName], async (err, existingFamily) => {
      if (err) {
        console.error("Erreur vérification famille :", err.message);

        return res.status(500).json({
          success: false,
          message: "Erreur lors de la vérification de la famille",
        });
      }

      if (existingFamily) {
        return res.status(409).json({
          success: false,
          message: "Cette famille existe déjà",
        });
      }

      const familyId = uuidv4();
      const pinHash = await bcrypt.hash(pin, 12);
      const createdAt = new Date().toISOString();

      const insertQuery = `
        INSERT INTO families (id, family_name, pin_hash, created_at)
        VALUES (?, ?, ?, ?)
      `;

      db.run(
        insertQuery,
        [familyId, familyName, pinHash, createdAt],
        function (err) {
          if (err) {
            console.error("Erreur insertion famille :", err.message);

            return res.status(500).json({
              success: false,
              message: "Erreur lors de la création de la famille",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Famille créée avec succès",
            data: {
              id: familyId,
              familyName,
              createdAt,
            },
          });
        }
      );
    });
  } catch (error) {
    console.error("Erreur createFamily :", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la famille",
    });
  }
};

const loginFamily = (req, res) => {
  try {
    const familyName = normalizeFamilyName(req.body.familyName);
    const pin = normalizePin(req.body.pin);

    if (!familyName || !pin) {
      return res.status(400).json({
        success: false,
        message: "familyName et mot de passe familial sont obligatoires",
      });
    }

    if (!isValidPin(pin)) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe familial doit contenir au moins 12 caractères, avec au moins une lettre et un chiffre.",
      });
    }

    const query = `
      SELECT id, family_name, pin_hash, created_at
      FROM families
      WHERE family_name = ?
    `;

    db.get(query, [familyName], async (err, family) => {
      if (err) {
        console.error("Erreur recherche famille :", err.message);

        return res.status(500).json({
          success: false,
          message: "Erreur lors de la connexion",
        });
      }

      if (!family) {
        const attempt = registerFailedPinAttempt(req);

        if (attempt.blocked) {
          return res.status(429).json({
            success: false,
            message:
              "Trop de tentatives incorrectes. L'accès est bloqué pendant 15 minutes.",
          });
        }

        return res.status(401).json({
          success: false,
          message: `Identifiants incorrects. Il vous reste ${attempt.remainingAttempts} essai(s).`,
        });
      }

      const isPinCorrect = await bcrypt.compare(pin, family.pin_hash);

      if (!isPinCorrect) {
        const attempt = registerFailedPinAttempt(req);

        if (attempt.blocked) {
          return res.status(429).json({
            success: false,
            message:
              "Trop de tentatives incorrectes. L'accès est bloqué pendant 15 minutes.",
          });
        }

        return res.status(401).json({
          success: false,
          message: `Identifiants incorrects. Il vous reste ${attempt.remainingAttempts} essai(s).`,
        });
      }

      resetPinAttempts(req);

      return res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data: {
          id: family.id,
          familyName: family.family_name,
          createdAt: family.created_at,
        },
      });
    });
  } catch (error) {
    console.error("Erreur loginFamily :", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
    });
  }
};

module.exports = {
  createFamily,
  loginFamily,
};