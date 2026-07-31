/**
 * Stage 2: Token management utilities
 * - httpOnly cookie helpers
 * - Refresh token blacklist (stored as SHA-256 hash in DB)
 * - Token rotation
 */

import crypto from "crypto";
import { Response } from "express";
import { prisma } from "./prisma";

const IS_PROD = process.env.NODE_ENV === "production";

// ─── Cookie configuration ─────────────────────────────────────────────────────

const ACCESS_COOKIE_OPTS = {
  httpOnly: true,                    // JavaScript cannot read — XSS protection
  secure: IS_PROD,                   // HTTPS only in production
  sameSite: "strict" as const,       // CSRF protection
  maxAge: 60 * 60 * 1000,            // 1 hour (ms)
  path: "/",
};

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days (ms)
  path: "/api/auth/refresh",          // Only sent to refresh endpoint
};

/** Set both tokens as httpOnly cookies */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTS);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
}

/** Clear both auth cookies on logout */
export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
}

// ─── Refresh token blacklist ──────────────────────────────────────────────────

/** Hash a token string for safe DB storage */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Store refresh token in DB (for rotation tracking) */
export async function storeRefreshToken(
  userId: string,
  jti: string,
  rawToken: string,
  expiresInDays = 7
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await prisma.refreshToken.create({
    data: {
      jti,
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });
}

/** Check if a refresh token jti is blacklisted (revoked) */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const token = await prisma.refreshToken.findUnique({
    where: { jti },
    select: { revokedAt: true, expiresAt: true },
  });

  if (!token) return true;                          // token tidak dikenal = tolak
  if (token.revokedAt) return true;                 // sudah di-revoke
  if (token.expiresAt < new Date()) return true;    // sudah expired
  return false;
}

/** Revoke a specific refresh token (logout / rotation) */
export async function revokeRefreshToken(jti: string) {
  try {
    await prisma.refreshToken.update({
      where: { jti },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Token mungkin tidak ada (tidak apa-apa)
  }
}

/** Revoke ALL refresh tokens for a user (logout all devices) */
export async function revokeAllUserTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Cleanup expired tokens (jalankan via cron) */
export async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
