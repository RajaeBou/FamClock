const {
  normalizeFamilyName,
  normalizePin,
  isValidPin,
} = require("../utils/pin.utils");

describe("pin.utils", () => {
  test("normalise le nom de famille", () => {
    expect(normalizeFamilyName("  FamilleTest  ")).toBe("familletest");
  });

  test("normalise le mot de passe familial", () => {
    expect(normalizePin("  Famille2026ab  ")).toBe("Famille2026ab");
  });

  test("accepte un mot de passe familial valide", () => {
    expect(isValidPin("Famille2026ab")).toBe(true);
  });

  test("refuse un ancien PIN à 4 chiffres", () => {
    expect(isValidPin("1234")).toBe(false);
  });

  test("refuse un mot de passe sans chiffre", () => {
    expect(isValidPin("maisonfamille")).toBe(false);
  });

  test("refuse un mot de passe sans lettre", () => {
    expect(isValidPin("123456789012")).toBe(false);
  });

  test("refuse un mot de passe trop court", () => {
    expect(isValidPin("Test2026")).toBe(false);
  });
});