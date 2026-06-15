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

module.exports = {
  normalizeFamilyName,
  normalizePin,
  isValidPin,
};