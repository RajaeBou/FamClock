const {
  clampAngle,
  angleToPulseMs,
  positionToAngle,
} = require("../utils/servo.utils");

describe("Servo utils", () => {
  test("limite un angle entre 0 et 180 degrés", () => {
    expect(clampAngle(-20)).toBe(0);
    expect(clampAngle(90)).toBe(90);
    expect(clampAngle(200)).toBe(180);
  });

  test("convertit un angle en largeur d'impulsion PWM", () => {
    expect(angleToPulseMs(0)).toBeCloseTo(1);
    expect(angleToPulseMs(90)).toBeCloseTo(1.5);
    expect(angleToPulseMs(100)).toBeCloseTo(1.56, 2);
    expect(angleToPulseMs(180)).toBeCloseTo(2);
  });

  test("convertit une position du cadran en angle", () => {
    expect(positionToAngle(0, 8)).toBe(0);
    expect(positionToAngle(1, 8)).toBe(45);
    expect(positionToAngle(2, 8)).toBe(90);
    expect(positionToAngle(4, 8)).toBe(180);
  });

  test("refuse une position inexistante sur le cadran", () => {
    expect(() => positionToAngle(-1, 8)).toThrow("Position invalide");
    expect(() => positionToAngle(8, 8)).toThrow("Position invalide");
  });
});