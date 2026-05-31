const {
  normalizePositionName,
  hasDuplicatePositionNames,
  hasDuplicatePositionSlots,
  validateClockPositions,
} = require("../utils/clockPosition.utils");

describe("Clock position utils", () => {
  test("normalise le nom d'un emplacement", () => {
    expect(normalizePositionName("  Maison  ")).toBe("maison");
    expect(normalizePositionName("TRAVAIL")).toBe("travail");
  });

  test("détecte deux emplacements avec le même nom", () => {
    const positions = [
      { name: "Maison", slotIndex: 0 },
      { name: "École", slotIndex: 1 },
      { name: " maison ", slotIndex: 2 },
    ];

    expect(hasDuplicatePositionNames(positions)).toBe(true);
  });

  test("ne détecte pas de doublon si les noms sont différents", () => {
    const positions = [
      { name: "Maison", slotIndex: 0 },
      { name: "École", slotIndex: 1 },
      { name: "Travail", slotIndex: 2 },
    ];

    expect(hasDuplicatePositionNames(positions)).toBe(false);
  });

  test("détecte deux positions utilisant le même emplacement physique", () => {
    const positions = [
      { name: "Maison", slotIndex: 0 },
      { name: "École", slotIndex: 1 },
      { name: "Travail", slotIndex: 1 },
    ];

    expect(hasDuplicatePositionSlots(positions)).toBe(true);
  });

  test("valide une configuration correcte de l'horloge", () => {
    const positions = [
      { name: "Maison", slotIndex: 0 },
      { name: "École", slotIndex: 1 },
      { name: "Travail", slotIndex: 2 },
      { name: "Sport", slotIndex: 3 },
    ];

    const result = validateClockPositions(positions);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("refuse une configuration avec doublons", () => {
    const positions = [
      { name: "Maison", slotIndex: 0 },
      { name: "Maison", slotIndex: 0 },
    ];

    const result = validateClockPositions(positions);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Deux emplacements de l'horloge portent le même nom"
    );
    expect(result.errors).toContain(
      "Deux emplacements utilisent le même emplacement physique"
    );
  });
});