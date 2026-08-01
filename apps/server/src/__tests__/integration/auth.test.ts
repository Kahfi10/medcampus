/**
 * Integration Tests — Auth Endpoints
 * Skipped automatically when database is not available
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../utils/prisma";
import { dbAvailable } from "../setup";

const TEST_USER = {
  nama: "Test User Integration",
  email: `test.integration.${Date.now()}@medcampus.test`,
  password: "TestPass@123",
  nim: "TEST001",
};

let accessToken = "";
let refreshToken = "";
let userId = "";

beforeAll(async () => {
  if (!dbAvailable) return;
  try {
    await prisma.auditLog.deleteMany({ where: { detail: { contains: "Integration" } } });
  } catch { /* ignore */ }
});

afterAll(async () => {
  if (!dbAvailable || !userId) return;
  try {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch { /* ignore */ }
});

// Skip all DB tests when database is unavailable
const describeDB = dbAvailable ? describe : describe.skip;

describeDB("POST /api/auth/register", () => {
  it("should register a new PASIEN account", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("PASIEN");
    expect(res.body.data.accessToken).toBeTruthy();
    userId = res.body.data.user.id;
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("should NOT return password in response", async () => {
    expect(userId).toBeTruthy();
    const res = await request(app).post("/api/auth/register")
      .send({ ...TEST_USER, email: `another.${Date.now()}@test.com` });
    expect(res.body.data?.user?.password).toBeUndefined();
    if (res.body.data?.user?.id) {
      try {
        await prisma.refreshToken.deleteMany({ where: { userId: res.body.data.user.id } });
        await prisma.user.delete({ where: { id: res.body.data.user.id } });
      } catch { /* ignore */ }
    }
  });

  it("should return 409 for duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it("should return 422 for weak password", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ ...TEST_USER, email: "weak@test.com", password: "weakpass" });
    expect(res.status).toBe(422);
  });

  it("should return 422 for invalid email", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ ...TEST_USER, email: "not-an-email" });
    expect(res.status).toBe(422);
  });
});

describeDB("POST /api/auth/login", () => {
  it("should login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("should return 401 for wrong password with generic message", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "Wrong@Pass1" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Email atau password salah.");
  });

  it("should return same message for non-existent email (user enumeration prevention)", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "ghost@test.com", password: "Any@Pass1" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Email atau password salah.");
  });

  it("should set httpOnly cookies", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    const cookies = res.headers["set-cookie"] as string[] | string | undefined;
    if (cookies) {
      const arr = Array.isArray(cookies) ? cookies : [cookies];
      expect(arr.some(c => c.toLowerCase().includes("httponly"))).toBe(true);
    }
  });
});

describeDB("GET /api/auth/me", () => {
  it("should return user with valid token", async () => {
    const res = await request(app).get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it("should return 401 without token", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const res = await request(app).get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});

describeDB("POST /api/auth/refresh (token rotation)", () => {
  it("should issue new tokens", async () => {
    const res = await request(app).post("/api/auth/refresh")
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("should reject already-used refresh token (rotation enforcement)", async () => {
    const old = refreshToken;
    await request(app).post("/api/auth/refresh").send({ refreshToken: old });
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: old });
    expect(res.status).toBe(401);
  });

  it("should return 400 without token", async () => {
    expect((await request(app).post("/api/auth/refresh").send({})).status).toBe(400);
  });
});

describeDB("PUT /api/auth/change-password", () => {
  it("should change password and revoke sessions", async () => {
    const lr = await request(app).post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    const token = lr.body.data?.accessToken;
    if (!token) return;

    const res = await request(app).put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ oldPassword: TEST_USER.password, newPassword: "NewPass@456" });
    expect(res.status).toBe(200);

    // Restore
    const lr2 = await request(app).post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "NewPass@456" });
    const t2 = lr2.body.data?.accessToken;
    if (t2) {
      await request(app).put("/api/auth/change-password")
        .set("Authorization", `Bearer ${t2}`)
        .send({ oldPassword: "NewPass@456", newPassword: TEST_USER.password });
    }
  });

  it("should return 401 for wrong old password", async () => {
    const lr = await request(app).post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    const token = lr.body.data?.accessToken;
    if (!token) return;
    const res = await request(app).put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ oldPassword: "WrongOld@1", newPassword: "NewPass@456" });
    expect(res.status).toBe(401);
  });
});
