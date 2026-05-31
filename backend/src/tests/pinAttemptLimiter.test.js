const {
  registerFailedPinAttempt,
  resetPinAttempts,
} = require("../middlewares/pinAttemptLimiter");

const createMockRequest = (familyName = "famille-test", ip = "127.0.0.1") => {
  return {
    ip,
    body: {
      familyName,
    },
  };
};

describe("PIN attempt limiter", () => {
  test("décompte les essais restants après chaque mauvais PIN", () => {
    const req = createMockRequest("famille-decompte", "10.0.0.1");

    const attempt1 = registerFailedPinAttempt(req);
    expect(attempt1.blocked).toBe(false);
    expect(attempt1.remainingAttempts).toBe(2);

    const attempt2 = registerFailedPinAttempt(req);
    expect(attempt2.blocked).toBe(false);
    expect(attempt2.remainingAttempts).toBe(1);
  });

  test("bloque l'accès après 3 tentatives incorrectes", () => {
    const req = createMockRequest("famille-blocage", "10.0.0.2");

    registerFailedPinAttempt(req);
    registerFailedPinAttempt(req);
    const attempt3 = registerFailedPinAttempt(req);

    expect(attempt3.blocked).toBe(true);
    expect(attempt3.remainingAttempts).toBe(0);
  });

  test("réinitialise le compteur après une connexion réussie", () => {
    const req = createMockRequest("famille-reset", "10.0.0.3");

    const attempt1 = registerFailedPinAttempt(req);
    expect(attempt1.remainingAttempts).toBe(2);

    resetPinAttempts(req);

    const newAttempt = registerFailedPinAttempt(req);
    expect(newAttempt.blocked).toBe(false);
    expect(newAttempt.remainingAttempts).toBe(2);
  });
});