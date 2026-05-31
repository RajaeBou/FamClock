const normalizePositionName = (name) => {
  return String(name || "").trim().toLowerCase();
};

const hasDuplicatePositionNames = (positions) => {
  const names = positions.map((position) =>
    normalizePositionName(position.name)
  );

  return new Set(names).size !== names.length;
};

const hasDuplicatePositionSlots = (positions) => {
  const slots = positions.map((position) => position.slotIndex);

  return new Set(slots).size !== slots.length;
};

const validateClockPositions = (positions) => {
  const errors = [];

  if (!Array.isArray(positions)) {
    return {
      isValid: false,
      errors: ["La liste des positions est invalide"],
    };
  }

  if (hasDuplicatePositionNames(positions)) {
    errors.push("Deux emplacements de l'horloge portent le même nom");
  }

  if (hasDuplicatePositionSlots(positions)) {
    errors.push("Deux emplacements utilisent le même emplacement physique");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  normalizePositionName,
  hasDuplicatePositionNames,
  hasDuplicatePositionSlots,
  validateClockPositions,
};