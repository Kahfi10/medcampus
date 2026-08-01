/**
 * Unit Tests — Password Utility (bcrypt + Argon2 lazy migration)
 */
import { describe, it, expect } from "vitest";
import { hashPasswordSafe, verifyPassword, isBcryptHash, isArgon2Hash } from "../../utils/password";
import bcrypt from "bcryptjs";

describe("Password Utility — Argon2 + bcrypt", () => {
  describe("isBcryptHash() & isArgon2Hash()", () => {
    it("should detect bcrypt hash", () => {
      expect(isBcryptHash("$2b$12$somehashedvalue")).toBe(true);
      expect(isBcryptHash("$2a$10$somehashedvalue")).toBe(true);
      expect(isBcryptHash("$argon2id$...")).toBe(false);
    });

    it("should detect argon2 hash", () => {
      expect(isArgon2Hash("$argon2id$v=19$...")).toBe(true);
      expect(isArgon2Hash("$argon2i$v=19$...")).toBe(true);
      expect(isArgon2Hash("$2b$12$...")).toBe(false);
    });
  });

  describe("hashPasswordSafe()", () => {
    it("should hash a password and return a string", async () => {
      const hash = await hashPasswordSafe("Password@123");
      expect(hash).toBeTruthy();
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should produce different hashes for same password (salt)", async () => {
      const h1 = await hashPasswordSafe("Password@123");
      const h2 = await hashPasswordSafe("Password@123");
      expect(h1).not.toBe(h2);
    });

    it("should not store plaintext password", async () => {
      const hash = await hashPasswordSafe("MySecret@123");
      expect(hash).not.toBe("MySecret@123");
      expect(hash).not.toContain("MySecret");
    });
  });

  describe("verifyPassword()", () => {
    it("should verify a newly hashed password (argon2)", async () => {
      const hash = await hashPasswordSafe("Correct@Pass1");
      const result = await verifyPassword("Correct@Pass1", hash);
      expect(result.match).toBe(true);
    });

    it("should return false for wrong password", async () => {
      const hash = await hashPasswordSafe("Correct@Pass1");
      const result = await verifyPassword("Wrong@Pass1", hash);
      expect(result.match).toBe(false);
    });

    it("should verify bcrypt hash (backward compat)", async () => {
      const bcryptHash = await bcrypt.hash("BcryptPass@1", 10);
      const result = await verifyPassword("BcryptPass@1", bcryptHash);
      expect(result.match).toBe(true);
      expect(result.needsRehash).toBe(true); // perlu migrate ke argon2
    });

    it("should flag bcrypt hash for rehash migration", async () => {
      const bcryptHash = await bcrypt.hash("Migrate@Me1", 10);
      const result = await verifyPassword("Migrate@Me1", bcryptHash);
      expect(result.needsRehash).toBe(true);
    });

    it("should NOT flag argon2 hash for rehash", async () => {
      const argonHash = await hashPasswordSafe("AlreadyArgon@2");
      const result = await verifyPassword("AlreadyArgon@2", argonHash);
      expect(result.needsRehash).toBe(false);
    });

    it("should return false for unknown hash format", async () => {
      const result = await verifyPassword("any", "unknown_hash_format");
      expect(result.match).toBe(false);
    });
  });
});
