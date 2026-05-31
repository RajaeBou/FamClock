const {
  timeToMinutes,
  isValidTimeRange,
  doTimeRangesOverlap,
  hasScheduleConflict,
  isDateTimeInPast,
  validateScheduleRule,
} = require("../utils/schedule.utils");

describe("Schedule utils", () => {
  test("convertit une heure HH:mm en minutes", () => {
    expect(timeToMinutes("08:00")).toBe(480);
    expect(timeToMinutes("12:30")).toBe(750);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  test("valide qu'une heure de début est avant l'heure de fin", () => {
    expect(isValidTimeRange("08:00", "10:00")).toBe(true);
    expect(isValidTimeRange("10:00", "08:00")).toBe(false);
    expect(isValidTimeRange("10:00", "10:00")).toBe(false);
  });

  test("détecte un conflit horaire entre deux règles qui se chevauchent", () => {
    const ruleA = {
      startTime: "08:00",
      endTime: "10:00",
    };

    const ruleB = {
      startTime: "09:00",
      endTime: "11:00",
    };

    expect(doTimeRangesOverlap(ruleA, ruleB)).toBe(true);
  });

  test("ne détecte pas de conflit si les horaires ne se chevauchent pas", () => {
    const ruleA = {
      startTime: "08:00",
      endTime: "10:00",
    };

    const ruleB = {
      startTime: "10:00",
      endTime: "12:00",
    };

    expect(doTimeRangesOverlap(ruleA, ruleB)).toBe(false);
  });

  test("détecte un conflit pour le même membre, le même jour et une plage horaire chevauchante", () => {
    const existingRules = [
      {
        memberId: "member-1",
        dayOfWeek: "monday",
        startTime: "08:00",
        endTime: "10:00",
      },
    ];

    const newRule = {
      memberId: "member-1",
      dayOfWeek: "monday",
      startTime: "09:30",
      endTime: "11:00",
    };

    expect(hasScheduleConflict(newRule, existingRules)).toBe(true);
  });

  test("ne détecte pas de conflit pour un autre membre ou un autre jour", () => {
    const existingRules = [
      {
        memberId: "member-1",
        dayOfWeek: "monday",
        startTime: "08:00",
        endTime: "10:00",
      },
    ];

    const newRule = {
      memberId: "member-2",
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "11:00",
    };

    expect(hasScheduleConflict(newRule, existingRules)).toBe(false);
  });

  test("valide une règle de planning récurrente complète", () => {
    const rule = {
      memberId: "member-1",
      positionId: "position-1",
      dayOfWeek: "monday",
      startTime: "08:00",
      endTime: "10:00",
    };

    const result = validateScheduleRule(rule);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("refuse une règle de planning incomplète", () => {
    const rule = {
      memberId: "member-1",
      startTime: "08:00",
      endTime: "10:00",
    };

    const result = validateScheduleRule(rule);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("positionId est obligatoire");
    expect(result.errors).toContain("dayOfWeek ou date est obligatoire");
  });

  test("détecte qu'un événement daté est dans le passé", () => {
    const now = new Date("2026-05-29T10:00:00");

    expect(isDateTimeInPast("2026-05-28", "08:00", now)).toBe(true);
    expect(isDateTimeInPast("2026-05-29", "09:00", now)).toBe(true);
  });

  test("accepte un événement daté dans le futur", () => {
    const now = new Date("2026-05-29T10:00:00");

    expect(isDateTimeInPast("2026-05-29", "11:00", now)).toBe(false);
    expect(isDateTimeInPast("2026-05-30", "08:00", now)).toBe(false);
  });

  test("refuse une règle de planning ponctuelle dans le passé", () => {
    const now = new Date("2026-05-29T10:00:00");

    const pastRule = {
      memberId: "member-1",
      positionId: "position-1",
      date: "2026-05-28",
      startTime: "08:00",
      endTime: "10:00",
    };

    const result = validateScheduleRule(pastRule, now);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "La règle de planning ne peut pas être dans le passé"
    );
  });

  test("refuse une règle de planning ponctuelle aujourd'hui avec une heure déjà passée", () => {
    const now = new Date("2026-05-29T10:00:00");

    const pastRule = {
      memberId: "member-1",
      positionId: "position-1",
      date: "2026-05-29",
      startTime: "09:00",
      endTime: "11:00",
    };

    const result = validateScheduleRule(pastRule, now);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "La règle de planning ne peut pas être dans le passé"
    );
  });

  test("accepte une règle de planning ponctuelle dans le futur", () => {
    const now = new Date("2026-05-29T10:00:00");

    const futureRule = {
      memberId: "member-1",
      positionId: "position-1",
      date: "2026-05-29",
      startTime: "11:00",
      endTime: "12:00",
    };

    const result = validateScheduleRule(futureRule, now);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("ne considère pas une règle récurrente comme passée", () => {
    const now = new Date("2026-05-29T10:00:00");

    const recurringRule = {
      memberId: "member-1",
      positionId: "position-1",
      dayOfWeek: "monday",
      startTime: "08:00",
      endTime: "10:00",
    };

    const result = validateScheduleRule(recurringRule, now);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});