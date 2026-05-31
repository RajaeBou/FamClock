process.env.AES_SECRET_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const {
  encryptToken,
  decryptToken,
} = require("../utils/crypto.utils");

describe("OAuth token encryption", () => {
  test("chiffre un token OAuth sans le stocker en clair", () => {
    const token = "ya29.exemple-token-google";

    const encrypted = encryptToken(token);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(token);
    expect(encrypted).not.toContain(token);
  });

  test("produit un format en trois parties : iv:authTag:tokenChiffré", () => {
    const token = "ya29.exemple-token-google";

    const encrypted = encryptToken(token);
    const parts = encrypted.split(":");

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBeTruthy();
    expect(parts[1]).toBeTruthy();
    expect(parts[2]).toBeTruthy();
  });

  test("déchiffre correctement le token original", () => {
    const token = "ya29.exemple-token-google";

    const encrypted = encryptToken(token);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(token);
  });
});