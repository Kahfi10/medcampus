/**
 * Security Tests — Rate Limiting, Account Lockout, RBAC, IDOR
 * Tests keamanan aplikasi secara end-to-end
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../utils/prisma";
import { hashPasswordSafe } from "../../utils/password";
import { dbAvailable } from "../setup";

const PASIEN_USER = {
  email: `pasien.sec.${Date.now()}@test.com`,
  password: "PasienSec@123",
  nama: "Test Pasien Security",
};
const PASIEN_USER_2 = {
  email: `pasien2.sec.${Date.now()}@test.com`,
  password: "Pasien2Sec@123",
  nama: "Test Pasien 2 Security",
};

let pasienToken = "";
let pasien2Token = "";
let pasienId = "";
let pasien2Id = "";

beforeAll(async () => {
  if (!dbAvailable) return;
  try {
    const hash = await hashPasswordSafe(PASIEN_USER.password);
    const u1 = await prisma.user.create({ data: { ...PASIEN_USER, password: hash, role: "PASIEN" } });
    pasienId = u1.id;
    const hash2 = await hashPasswordSafe(PASIEN_USER_2.password);
    const u2 = await prisma.user.create({ data: { ...PASIEN_USER_2, password: hash2, role: "PASIEN" } });
    pasien2Id = u2.id;
    const r1 = await request(app).post("/api/auth/login").send({ email: PASIEN_USER.email, password: PASIEN_USER.password });
    pasienToken = r1.body.data?.accessToken || "";
    const r2 = await request(app).post("/api/auth/login").send({ email: PASIEN_USER_2.email, password: PASIEN_USER_2.password });
    pasien2Token = r2.body.data?.accessToken || "";
  } catch (e) { console.warn("[Test] Security test setup failed:", e); }
});

afterAll(async () => {
  if (!dbAvailable) return;
  const ids = [pasienId, pasien2Id].filter(Boolean);
  if (ids.length === 0) return;
  try {
    await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  } catch { /* ignore */ }
});

const describeDB = dbAvailable ? describe : describe.skip;

// ─── RBAC Tests ──────────────────────────────────────────────────────────────

describeDB("RBAC — Role-Based Access Control", () => {
  it("PASIEN should NOT access admin endpoint GET /api/users", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${pasienToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Akses ditolak");
  });

  it("PASIEN should NOT access dokter endpoint GET /api/kunjungan (all)", async () => {
    const res = await request(app)
      .get("/api/kunjungan")
      .set("Authorization", `Bearer ${pasienToken}`);

    expect(res.status).toBe(403);
  });

  it("PASIEN can access own kunjungan GET /api/kunjungan/saya", async () => {
    const res = await request(app)
      .get("/api/kunjungan/saya")
      .set("Authorization", `Bearer ${pasienToken}`);

    expect(res.status).toBe(200);
  });

  it("unauthenticated request should return 401", async () => {
    const res = await request(app).get("/api/kunjungan/saya");
    expect(res.status).toBe(401);
  });

  it("PASIEN should NOT POST rekam medis (Dokter only)", async () => {
    const res = await request(app)
      .post("/api/rekam-medis")
      .set("Authorization", `Bearer ${pasienToken}`)
      .send({ kunjunganId: "test", diagnosa: "test", tindakan: "test" });

    expect(res.status).toBe(403);
  });

  it("PASIEN should NOT access audit log (Admin only)", async () => {
    const res = await request(app)
      .get("/api/audit-log")
      .set("Authorization", `Bearer ${pasienToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── IDOR Tests ───────────────────────────────────────────────────────────────

describeDB("IDOR — Insecure Direct Object Reference Protection", () => {
  it("PASIEN should only see own kunjungan via /saya", async () => {
    // Buat kunjungan untuk pasien1
    const kRes = await request(app)
      .post("/api/kunjungan")
      .set("Authorization", `Bearer ${pasienToken}`)
      .send({ tanggal: new Date().toISOString().split("T")[0], keluhan: "Sakit kepala IDOR test" });

    if (kRes.status === 201) {
      const kunjunganId = kRes.body.data.id;

      // Pasien2 TIDAK boleh bisa batalkan kunjungan milik pasien1
      const deleteRes = await request(app)
        .delete(`/api/kunjungan/${kunjunganId}`)
        .set("Authorization", `Bearer ${pasien2Token}`);

      expect(deleteRes.status).toBe(403);

      // Cleanup
      await prisma.kunjungan.delete({ where: { id: kunjunganId } });
    }
  });

  it("ACCESS_DENIED should be logged for IDOR attempts", async () => {
    // Buat rekam medis test secara langsung
    const kunjungan = await prisma.kunjungan.create({
      data: { pasienId: pasienId, tanggal: new Date(), keluhan: "test IDOR", status: "SELESAI" },
    });
    const rekam = await prisma.rekamMedis.create({
      data: {
        kunjunganId: kunjungan.id,
        dokterId: pasienId, // pakai pasienId sebagai dummy dokterId
        diagnosa: "test",
        tindakan: "test",
      },
    });

    // Pasien2 coba akses rekam medis milik pasien1
    const res = await request(app)
      .get(`/api/rekam-medis/${rekam.id}`)
      .set("Authorization", `Bearer ${pasien2Token}`);

    expect(res.status).toBe(403);

    // Verifikasi audit log mencatat ACCESS_DENIED
    const auditEntry = await prisma.auditLog.findFirst({
      where: { userId: pasien2Id, aksi: "ACCESS_DENIED" },
      orderBy: { createdAt: "desc" },
    });
    expect(auditEntry).toBeTruthy();
    expect(auditEntry?.detail).toContain("IDOR");

    // Cleanup
    await prisma.rekamMedis.delete({ where: { id: rekam.id } });
    await prisma.kunjungan.delete({ where: { id: kunjungan.id } });
  });
});

// ─── Account Lockout Tests ────────────────────────────────────────────────────

describeDB("Account Lockout", () => {
  it("should increment failedLoginAttempts on wrong password", async () => {
    const before = await prisma.user.findUnique({
      where: { id: pasienId },
      select: { failedLoginAttempts: true },
    });

    await request(app)
      .post("/api/auth/login")
      .send({ email: PASIEN_USER.email, password: "Wrong@Pass1" });

    const after = await prisma.user.findUnique({
      where: { id: pasienId },
      select: { failedLoginAttempts: true },
    });

    expect(after!.failedLoginAttempts).toBeGreaterThan(before!.failedLoginAttempts);
  });

  it("should reset failedLoginAttempts after successful login", async () => {
    // Set failedAttempts manually
    await prisma.user.update({
      where: { id: pasienId },
      data: { failedLoginAttempts: 3 },
    });

    await request(app)
      .post("/api/auth/login")
      .send({ email: PASIEN_USER.email, password: PASIEN_USER.password });

    const after = await prisma.user.findUnique({
      where: { id: pasienId },
      select: { failedLoginAttempts: true },
    });

    expect(after!.failedLoginAttempts).toBe(0);
  });

  it("should lock account after 5 failed attempts", async () => {
    // Set attempts to 4
    await prisma.user.update({
      where: { id: pasien2Id },
      data: { failedLoginAttempts: 4, lockedUntil: null },
    });

    // Attempt yang ke-5 (akan lock)
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: PASIEN_USER_2.email, password: "Wrong@Pass5" });

    expect([401, 423]).toContain(res.status);

    // Cek lockedUntil diset
    const user = await prisma.user.findUnique({
      where: { id: pasien2Id },
      select: { lockedUntil: true },
    });
    expect(user!.lockedUntil).toBeTruthy();

    // Cleanup lockout
    await prisma.user.update({
      where: { id: pasien2Id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  it("should block login for locked account", async () => {
    // Lock account manually
    await prisma.user.update({
      where: { id: pasien2Id },
      data: {
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 menit
        failedLoginAttempts: 5,
      },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: PASIEN_USER_2.email, password: PASIEN_USER_2.password });

    expect(res.status).toBe(423);
    expect(res.body.message).toContain("terkunci");

    // Cleanup
    await prisma.user.update({
      where: { id: pasien2Id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });
});

// ─── Security Headers Tests ───────────────────────────────────────────────────

describeDB("Security Headers", () => {
  it("should include X-Content-Type-Options header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should include X-Frame-Options or CSP frame-ancestors", async () => {
    const res = await request(app).get("/health");
    const hasFrameOptions = !!res.headers["x-frame-options"];
    const hasCspFrameAncestors = res.headers["content-security-policy"]?.includes("frame-ancestors");
    expect(hasFrameOptions || hasCspFrameAncestors).toBe(true);
  });

  it("should NOT expose X-Powered-By header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("should include Content-Security-Policy header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["content-security-policy"]).toBeTruthy();
  });
});

// ─── Input Validation Tests ───────────────────────────────────────────────────

describeDB("Input Validation & Sanitization", () => {
  it("should reject oversized request body", async () => {
    const largeBody = { data: "x".repeat(15000) }; // > 10kb limit
    const res = await request(app)
      .post("/api/auth/login")
      .send(largeBody);

    expect([400, 413, 422]).toContain(res.status);
  });

  it("should sanitize email input via normalizeEmail", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "TEST@MEDCAMPUS.COM", password: "any" });

    // Should normalize — not crash
    expect(res.status).toBe(401); // normalized to lowercase, user not found
  });

  it("should reject SQL injection attempt in email field", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "' OR '1'='1", password: "anything" });

    expect(res.status).toBe(422); // invalid email format
    expect(res.body.success).toBe(false);
  });
});

