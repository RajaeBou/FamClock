const { rateLimit } = require("express-rate-limit");

const pinLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // maximum 5 tentatives
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  },
});

module.exports = {
  pinLoginLimiter,
};