const normalizeFamilyName = (familyName) => {
  return String(familyName || "").trim().toLowerCase();
};

const normalizePin = (pin) => {
  return String(pin || "").trim();
};

const isValidPin = (pin) => {
  return /^\d{4}$/.test(normalizePin(pin));
};

module.exports = {
  normalizeFamilyName,
  normalizePin,
  isValidPin,
};