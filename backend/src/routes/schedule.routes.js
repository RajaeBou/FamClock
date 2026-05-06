const express = require("express");
const router = express.Router();

const {
  createScheduleRule,
  getScheduleRulesByMember,
  getActiveScheduleRule,
  getPlanningSettings,
  updatePlanningSettings,
  getScheduleConflictsByMember,
  resolveScheduleConflict,
  deleteScheduleRule,
  keepScheduleRuleAndIgnoreConflicts,
} = require("../controllers/schedule.controller");

// Créer une règle de planning
router.post("/", createScheduleRule);

// Paramètres du planning d'une famille
router.get("/settings/:familyId", getPlanningSettings);
router.put("/settings/:familyId", updatePlanningSettings);

// Conflits d'un membre
router.get("/conflicts/:memberId", getScheduleConflictsByMember);

// Résoudre un conflit classique
router.patch("/:ruleId/resolve", resolveScheduleConflict);

// Garder une règle et ignorer les règles en conflit
router.patch("/:ruleId/keep", keepScheduleRuleAndIgnoreConflicts);

// Supprimer une règle
router.delete("/:ruleId", deleteScheduleRule);

// Règle active actuellement pour un membre
router.get("/active/:memberId", getActiveScheduleRule);

// Toutes les règles d'un membre
router.get("/:memberId", getScheduleRulesByMember);

module.exports = router;