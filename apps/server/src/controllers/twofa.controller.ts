/**
 * Stage 7: Two-Factor Authentication (TOTP)
 * Menggunakan speakeasy (RFC 6238 TOTP) yang compatible dengan Google Authenticator
 */

import { Request, Response } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "../utils/prisma";
import { createAuditLog } from "../utils/audit";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";

/** POST /api/auth/2fa/setup — generate secret & QR code */
export async function setup2FA(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, twoFactorEnabled: true },
  });

  if (!user) throw new AppError(404, "User tidak ditemukan.");
  if (user.twoFactorEnabled) throw new AppError(400, "2FA sudah diaktifkan.");

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `MedCampus (${user.email})`,
    issuer: "MedCampus",
    length: 32,
  });

  // Simpan secret sementara (belum confirmed)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret.base32 },
  });

  // Generate QR Code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl, // base64 PNG untuk ditampilkan di frontend
    },
    message: "Scan QR code dengan Google Authenticator, lalu konfirmasi dengan POST /api/auth/2fa/verify",
  });
}

/** POST /api/auth/2fa/verify — confirm & enable 2FA */
export async function verify2FA(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.body as { token: string };
  if (!token) throw new AppError(400, "TOTP token wajib diisi.");

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user) throw new AppError(404, "User tidak ditemukan.");
  if (!user.twoFactorSecret) throw new AppError(400, "Setup 2FA belum dilakukan.");
  if (user.twoFactorEnabled) throw new AppError(400, "2FA sudah aktif.");

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1, // toleransi ±30 detik
  });

  if (!verified) throw new AppError(401, "Token 2FA tidak valid.");

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  await createAuditLog({
    userId: user.id,
    aksi: "2FA_ENABLED",
    detail: "Two-Factor Authentication enabled",
    ipAddress: req.ip,
  });

  res.json({ success: true, message: "2FA berhasil diaktifkan." });
}

/** POST /api/auth/2fa/disable — disable 2FA */
export async function disable2FA(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.body as { token: string };
  if (!token) throw new AppError(400, "TOTP token wajib diisi untuk menonaktifkan 2FA.");

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user) throw new AppError(404, "User tidak ditemukan.");
  if (!user.twoFactorEnabled) throw new AppError(400, "2FA tidak aktif.");

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret!,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) throw new AppError(401, "Token 2FA tidak valid.");

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  await createAuditLog({
    userId: user.id,
    aksi: "2FA_DISABLED",
    detail: "Two-Factor Authentication disabled",
    ipAddress: req.ip,
  });

  res.json({ success: true, message: "2FA berhasil dinonaktifkan." });
}

/**
 * Validate TOTP saat login (dipanggil dari login controller jika 2FA aktif)
 */
export function validateTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}
