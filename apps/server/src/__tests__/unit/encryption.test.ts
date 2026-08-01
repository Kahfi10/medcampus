/**
 * Unit Tests — Encryption Utility (AES-256-GCM)
 */
import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  encryptNullable,
  decryptNullable,
  encryptRekamMedis,
  decryptRekamMedis,
} from "../../utils/encryption";

describe("Encryption Utility — AES-256-GCM", () => {
  describe("encrypt() & decrypt()", () => {
    it("should encrypt a string and produce a different output", () => {
      const plaintext = "Hipertensi Grade 2";
      const ciphertext = encrypt(plaintext);
      expect(ciphertext).not.toBe(plaintext);
      expect(ciphertext.split(":")).toHaveLength(3);
    });

    it("should decrypt back to original plaintext", () => {
      const plaintext = "Diagnosa: Diabetes Mellitus Tipe 2";
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext for same input (random IV)", () => {
      const plaintext = "Tindakan: Pemberian obat";
      const ct1 = encrypt(plaintext);
      const ct2 = encrypt(plaintext);
      expect(ct1).not.toBe(ct2); // IV berbeda setiap kali
    });

    it("should handle empty string (pass-through)", () => {
      expect(encrypt("")).toBe("");
      expect(decrypt("")).toBe("");
    });

    it("should return placeholder for invalid/tampered ciphertext", () => {
      const result = decrypt("invalid:data:here");
      expect(result).toContain("DATA TERENKRIPSI");
    });

    it("should return plaintext as-is for non-encrypted legacy data", () => {
      const legacy = "Data lama tanpa enkripsi";
      const result = decrypt(legacy); // tidak ada separator ":"
      expect(result).toBe(legacy);
    });
  });

  describe("encryptNullable() & decryptNullable()", () => {
    it("should return null for null input", () => {
      expect(encryptNullable(null)).toBeNull();
      expect(decryptNullable(null)).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(encryptNullable(undefined)).toBeNull();
      expect(decryptNullable(undefined)).toBeNull();
    });

    it("should encrypt non-null value", () => {
      const result = encryptNullable("Catatan medis");
      expect(result).not.toBeNull();
      expect(result!.split(":")).toHaveLength(3);
    });

    it("should decrypt non-null value back to original", () => {
      const original = "Catatan: pasien alergi penisilin";
      const encrypted = encryptNullable(original);
      const decrypted = decryptNullable(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe("encryptRekamMedis() & decryptRekamMedis()", () => {
    it("should encrypt all medical fields", () => {
      const data = {
        diagnosa: "Hipertensi",
        tindakan: "Pemberian Amlodipine 5mg",
        catatan: "Kontrol 2 minggu",
      };
      const encrypted = encryptRekamMedis(data);
      expect(encrypted.diagnosa).not.toBe(data.diagnosa);
      expect(encrypted.tindakan).not.toBe(data.tindakan);
      expect(encrypted.catatan).not.toBe(data.catatan);
    });

    it("should decrypt back to original for complete round-trip", () => {
      const original = {
        id: "test-id",
        diagnosa: "Diabetes Mellitus",
        tindakan: "Insulin 10 unit",
        catatan: "Pantau gula darah",
        kunjunganId: "k1",
        dokterId: "d1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const encrypted = encryptRekamMedis(original);
      const decrypted = decryptRekamMedis({ ...original, ...encrypted });
      expect(decrypted.diagnosa).toBe(original.diagnosa);
      expect(decrypted.tindakan).toBe(original.tindakan);
      expect(decrypted.catatan).toBe(original.catatan);
    });

    it("should handle null catatan", () => {
      const data = { diagnosa: "ISPA", tindakan: "Amoxicillin 500mg", catatan: null };
      const encrypted = encryptRekamMedis(data);
      expect(encrypted.catatan).toBeNull();
    });
  });
});
