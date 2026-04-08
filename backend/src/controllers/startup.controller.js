const getStartupClockConfig = require("../services/startup.service");

async function getClockStartupConfig(req, res) {
  try {
    const familyId = req.query.familyId || null;
    const data = await getStartupClockConfig(familyId);

    return res.status(200).json({
      success: true,
      familyId: data.familyId,
      generatedAt: data.generatedAt,
      currentDayOfWeek: data.currentDayOfWeek,
      currentTime: data.currentTime,
      members: data.members,
      slots: data.slots,
      warnings: data.warnings,
    });
  } catch (error) {
    console.error("Erreur getClockStartupConfig :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de charger la configuration de démarrage de l'horloge.",
      error: error.message,
    });
  }
}

module.exports = {
  getClockStartupConfig,
};