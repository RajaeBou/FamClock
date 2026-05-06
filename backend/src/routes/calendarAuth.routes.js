const express = require("express");
const router = express.Router();

const {
  getCalendarConnectionStatus,
  connectGoogle,
  googleCallback,
  importGoogleEvents,
  connectOutlook,
  outlookCallback,
  importOutlookEvents,
} = require("../controllers/calendarAuth.controller");

router.get("/status/:familyId", getCalendarConnectionStatus);

router.get("/google/connect", connectGoogle);
router.get("/google/callback", googleCallback);
router.post("/google/import", importGoogleEvents);

router.get("/outlook/connect", connectOutlook);
router.get("/outlook/callback", outlookCallback);
router.post("/outlook/import", importOutlookEvents);

module.exports = router;