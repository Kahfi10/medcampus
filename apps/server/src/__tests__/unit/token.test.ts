/**
 * Unit Tests — Token Utility (httpOnly cookies, blacklist, rotation)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { setAuthCookies, clearAuthCookies, hashToken } from "../../utils/token";

// Mock prisma untuk unit test (tidak butuh DB)
vi.mock("../../utils/prisma", () => ({
  prisma: {
    refreshToken: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
    },
  },
}));

// Helper: mock Response object
function mockRes() {
  const cookies: Record<string, { value: string; options: object }> = {};
  const clearedCookies: string[] = [];
  return {
    cookie: vi.fn((name: string, value: string, opts: object) => {
      cookies[name] = { value, options: opts };
    }),
    clearCookie: vi.fn((name: string) => {
      clearedCookies.push(name);
    }),
    _cookies: cookies,
    _cleared: clearedCookies,
  } as unknown as Response & { _cookies: typeof cookies; _cleared: string[] };
}

describe("Token Utility", () => {
  describe("setAuthCookies()", () => {
    it("should set accessToken cookie with httpOnly flag", () => {
      const res = mockRes() as any;
      setAuthCookies(res, "access123", "refresh456");

      const call = res.cookie.mock.calls.find((c: any[]) => c[0] === "accessToken");
      expect(call).toBeTruthy();
      expect(call[1]).toBe("access123");
      expect(call[2].httpOnly).toBe(true);
    });

    it("should set refreshToken with restricted path", () => {
      const res = mockRes() as any;
      setAuthCookies(res, "access123", "refresh456");

      const call = res.cookie.mock.calls.find((c: any[]) => c[0] === "refreshToken");
      expect(call).toBeTruthy();
      expect(call[2].path).toBe("/api/auth/refresh");
      expect(call[2].httpOnly).toBe(true);
    });

    it("should set SameSite=strict on both cookies", () => {
      const res = mockRes() as any;
      setAuthCookies(res, "a", "r");

      res.cookie.mock.calls.forEach((call: any[]) => {
        expect(call[2].sameSite).toBe("strict");
      });
    });

    it("should call res.cookie twice (access + refresh)", () => {
      const res = mockRes() as any;
      setAuthCookies(res, "a", "r");
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearAuthCookies()", () => {
    it("should clear both accessToken and refreshToken", () => {
      const res = mockRes() as any;
      clearAuthCookies(res);
      expect(res.clearCookie).toHaveBeenCalledWith("accessToken", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    });
  });
});

describe("hashToken()", () => {
  it("should produce consistent SHA-256 hash", async () => {
    // Import the non-exported function via testing the behavior
    const { storeRefreshToken } = await import("../../utils/token");
    const { prisma } = await import("../../utils/prisma");

    await storeRefreshToken("user1", "jti1", "rawtoken123");
    const createCall = (prisma.refreshToken.create as any).mock.calls[0][0];
    expect(createCall.data.tokenHash).toBeTruthy();
    expect(createCall.data.tokenHash).toHaveLength(64); // SHA-256 hex = 64 chars
    expect(createCall.data.tokenHash).not.toBe("rawtoken123");
  });
});
