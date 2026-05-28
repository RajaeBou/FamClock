const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const key = process.env.AES_SECRET_KEY;

  if (!key) {
    throw new Error("AES_SECRET_KEY is missing in environment variables");
  }

  const buffer = Buffer.from(key, "hex");

  if (buffer.length !== 32) {
    throw new Error("AES_SECRET_KEY must be a 32-byte hex key");
  }

  return buffer;
}

function encryptToken(token) {
  if (!token) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decryptToken(encryptedToken) {
  if (!encryptedToken) return null;

  const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = {
  encryptToken,
  decryptToken,
};