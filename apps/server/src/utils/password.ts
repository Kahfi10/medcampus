/**
 * Stage 7: Argon2 migration utility
 *
 * Strategi: Lazy migration (transparan ke user)
 * - Saat login: jika hash = bcrypt → verify bcrypt → re-hash dengan argon2
 * - Hash baru tersimpan otomatis
 * - User tidak perlu ganti password
 *
 * Cara identifikasi hash:
 * - bcrypt: dimulai dengan "$2b$" atau "$2a$"
 * - argon2: dimulai dengan "$argon2"
 */

import bcrypt from "bcryptjs";
import * as argon2 from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 65536,  // 64 MB
  timeCost: 3,        // 3 iterasi
  parallelism: 4,     // 4 threads
};

/** Deteksi jenis hash */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2b$") || hash.startsWith("$2a$");
}

export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2");
}

/**
 * Verify password — mendukung bcrypt DAN argon2
 * Return: { match, needsRehash }
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<{ match: boolean; needsRehash: boolean }> {
  if (isBcryptHash(hash)) {
    const match = await bcrypt.compare(plaintext, hash);
    return { match, needsRehash: match }; // jika bcrypt match → perlu rehash ke argon2
  }

  if (isArgon2Hash(hash)) {
    const match = await argon2.verify(hash, plaintext);
    return { match, needsRehash: false };
  }

  return { match: false, needsRehash: false };
}

/**
 * Hash password baru dengan Argon2
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, ARGON2_OPTIONS);
}

/**
 * Hash password untuk backward compat — pakai bcrypt jika argon2 tidak tersedia
 */
export async function hashPasswordSafe(plaintext: string): Promise<string> {
  try {
    return await hashPassword(plaintext);
  } catch {
    // Fallback ke bcrypt jika argon2 gagal load
    return bcrypt.hash(plaintext, 12);
  }
}
