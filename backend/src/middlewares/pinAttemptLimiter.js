const MAX_FAILED_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minute

const attemptsStore = new Map();

const getAttemptKey = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";

  const familyName = String(req.body?.familyName || "")
    .trim()
    .toLowerCase();

  return `${ip}:${familyName}`;
};

const pinAttemptLimiter = (req, res, next) => {
  const key = getAttemptKey(req);
  const record = attemptsStore.get(key);

  if (!record) {
    return next();
  }

  if (record.blockedUntil && Date.now() < record.blockedUntil) {
    const remainingMs = record.blockedUntil - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return res.status(429).json({
      success: false,
      message: `Trop de tentatives incorrectes. Réessayez dans environ ${remainingMinutes} minute(s).`,
    });
  }

  if (record.blockedUntil && Date.now() >= record.blockedUntil) {
    attemptsStore.delete(key);
  }

  return next();
};

const registerFailedPinAttempt = (req) => {
  const key = getAttemptKey(req);

  const record = attemptsStore.get(key) || {
    failedAttempts: 0,
    blockedUntil: null,
  };

  record.failedAttempts += 1;

  const remainingAttempts = MAX_FAILED_ATTEMPTS - record.failedAttempts;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    attemptsStore.set(key, record);

    return {
      blocked: true,
      remainingAttempts: 0,
    };
  }

  attemptsStore.set(key, record);

  return {
    blocked: false,
    remainingAttempts,
  };
};

const resetPinAttempts = (req) => {
  const key = getAttemptKey(req);
  attemptsStore.delete(key);
};

module.exports = {
  pinAttemptLimiter,
  registerFailedPinAttempt,
  resetPinAttempts,
};