/**
 * Stage 4: AES-256-GCM Encryption for sensitive medical data
 *
 * Field yang dienkripsi:
 * - RekamMedis: diagnosa, tindakan, catatan
 * - User: alergi
 * - Kunjungan: keluhan
 *
 * Format ciphertext: iv:authTag:encryptedData (base64, colon-separated)
 * Key: 32-byte hex dari ENCRYPTION_KEY env var
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;  // 96-bit IV — GCM recommended
const TAG_LENGTH = 16; // 128-bit auth tag
const SEPARATOR = ":";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error("ENCRYPTION_KEY tidak diset di environment variables.");
  if (keyHex.length !== 64) throw new Error("ENCRYPTION_KEY harus 32 bytes (64 hex chars).");
  return Buffer.from(keyHex, "hex");
}

/** Enkripsi string — return format: "iv:authTag:ciphertext" (base64) */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted,
  ].join(SEPARATOR);
}

/** Dekripsi string dari format "iv:authTag:ciphertext" */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;

  // Jika bukan format terenkripsi (data lama), kembalikan as-is
  const parts = ciphertext.split(SEPARATOR);
  if (parts.length !== 3) return ciphertext;

  try {
    const key = getKey();
    const [ivB64, tagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedB64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // Dekripsi gagal — data mungkin rusak atau key salah
    // Return placeholder daripada throw (cegah data loss di UI)
    return "[DATA TERENKRIPSI — Hubungi Administrator]";
  }
}

/** Encrypt jika value ada, skip jika null/undefined */
export function encryptNullable(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  return encrypt(value);
}

/** Decrypt jika value ada, skip jika null/undefined */
export function decryptNullable(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  return decrypt(value);
}

/**
 * Encrypt fields dalam rekam medis sebelum disimpan ke DB
 */
export function encryptRekamMedis(data: {
  diagnosa: string;
  tindakan: string;
  catatan?: string | null;
}) {
  return {
    diagnosa: encrypt(data.diagnosa),
    tindakan: encrypt(data.tindakan),
    catatan: encryptNullable(data.catatan),
  };
}

/**
 * Decrypt fields rekam medis setelah dibaca dari DB
 */
export function decryptRekamMedis<T extends {
  diagnosa: string;
  tindakan: string;
  catatan?: string | null;
}>(record: T): T {
  return {
    ...record,
    diagnosa: decrypt(record.diagnosa),
    tindakan: decrypt(record.tindakan),
    catatan: decryptNullable(record.catatan),
  };
}
