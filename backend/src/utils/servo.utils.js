const MIN_ANGLE = 0;
const MAX_ANGLE = 180;
const MIN_PULSE_MS = 1;
const MAX_PULSE_MS = 2;

const clampAngle = (angle) => {
  const numericAngle = Number(angle);

  if (Number.isNaN(numericAngle)) {
    throw new Error("Angle invalide");
  }

  if (numericAngle < MIN_ANGLE) return MIN_ANGLE;
  if (numericAngle > MAX_ANGLE) return MAX_ANGLE;

  return numericAngle;
};

const angleToPulseMs = (angle) => {
  const safeAngle = clampAngle(angle);

  return (
    MIN_PULSE_MS +
    (safeAngle / MAX_ANGLE) * (MAX_PULSE_MS - MIN_PULSE_MS)
  );
};

const positionToAngle = (positionIndex, totalPositions = 8) => {
  if (positionIndex < 0 || positionIndex >= totalPositions) {
    throw new Error("Position invalide");
  }

  return (360 / totalPositions) * positionIndex;
};

module.exports = {
  clampAngle,
  angleToPulseMs,
  positionToAngle,
};