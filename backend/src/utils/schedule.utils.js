const timeToMinutes = (time) => {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Format d'heure invalide");
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Heure invalide");
  }

  return hours * 60 + minutes;
};

const isValidTimeRange = (startTime, endTime) => {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
};

const doTimeRangesOverlap = (rangeA, rangeB) => {
  const startA = timeToMinutes(rangeA.startTime);
  const endA = timeToMinutes(rangeA.endTime);
  const startB = timeToMinutes(rangeB.startTime);
  const endB = timeToMinutes(rangeB.endTime);

  return startA < endB && startB < endA;
};

const hasScheduleConflict = (newRule, existingRules) => {
  return existingRules.some((rule) => {
    const sameMember = rule.memberId === newRule.memberId;
    const sameDay = rule.dayOfWeek === newRule.dayOfWeek;

    if (!sameMember || !sameDay) {
      return false;
    }

    return doTimeRangesOverlap(newRule, rule);
  });
};

const isDateTimeInPast = (date, startTime, now = new Date()) => {
  if (!date || !startTime) {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Format de date invalide");
  }

  const ruleDateTime = new Date(`${date}T${startTime}:00`);

  if (Number.isNaN(ruleDateTime.getTime())) {
    throw new Error("Date ou heure invalide");
  }

  return ruleDateTime < now;
};

const validateScheduleRule = (rule, now = new Date()) => {
  const errors = [];

  if (!rule.memberId) errors.push("memberId est obligatoire");
  if (!rule.positionId) errors.push("positionId est obligatoire");

  // Soit une règle récurrente avec dayOfWeek,
  // soit un événement ponctuel avec date.
  if (!rule.dayOfWeek && !rule.date) {
    errors.push("dayOfWeek ou date est obligatoire");
  }

  if (!rule.startTime) errors.push("startTime est obligatoire");
  if (!rule.endTime) errors.push("endTime est obligatoire");

  if (
    rule.startTime &&
    rule.endTime &&
    !isValidTimeRange(rule.startTime, rule.endTime)
  ) {
    errors.push("L'heure de début doit être avant l'heure de fin");
  }

  // Cette vérification ne concerne que les événements datés.
  // Une règle récurrente avec dayOfWeek n'est pas considérée comme passée.
  if (rule.date && rule.startTime && isDateTimeInPast(rule.date, rule.startTime, now)) {
    errors.push("La règle de planning ne peut pas être dans le passé");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  timeToMinutes,
  isValidTimeRange,
  doTimeRangesOverlap,
  hasScheduleConflict,
  isDateTimeInPast,
  validateScheduleRule,
};