const {
  normalizeFamilyName,
  normalizePin,
  isValidPin,
} = require("../utils/pin.utils");

describe("PIN utils", () => {
  test("accepte uniquement un PIN composé exactement de 4 chiffres", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("0000")).toBe(true);
    expect(isValidPin("9876")).toBe(true);
  });

  test("refuse les PIN trop courts, trop longs ou contenant des lettres/symboles", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("12ab")).toBe(false);
    expect(isValidPin("abcd")).toBe(false);
    expect(isValidPin("12-4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });

  test("normalise le nom de famille", () => {
    expect(normalizeFamilyName("  FamilleTest  ")).toBe("familletest");
  });

  test("normalise le PIN", () => {
    expect(normalizePin(" 1234 ")).toBe("1234");
  });
});