import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { prisma } from "../utils/prisma";
import { createAuditLog } from "../utils/audit";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  setAuthCookies,
  clearAuthCookies,
  storeRefreshToken,
  isTokenRevoked,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "../utils/token";

const SALT_ROUNDS = 12;

// Stage 1 Fix: explicit algorithm, jti, iss, aud claims
function generateTokens(userId: string, email: string, role: string) {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sign = (payload: object, secret: string, exp: string, aud: string): string =>
    jwt.sign(payload, secret, { expiresIn: exp, algorithm: "HS256", issuer: "medcampus-api", audience: aud } as any);

  const accessToken = sign(
    { jti: accessJti, userId, email, role },
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRES_IN || "1h",
    "medcampus-client"
  );

  const refreshToken = sign(
    { jti: refreshJti, userId, email, role },
    process.env.JWT_REFRESH_SECRET!,
    process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    "medcampus-refresh"
  );

  return { accessToken, refreshToken, accessJti, refreshJti };
}

/** POST /api/auth/register */
export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: "Validasi gagal.", errors: errors.mapped() });
    return;
  }

  const { nama, email, password, nim, telepon } = req.body as {
    nama: string; email: string; password: string; nim?: string; telepon?: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, "Email sudah terdaftar. Gunakan email lain.");

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { nama, email, password: hashedPassword, role: "PASIEN", nim: nim ?? null, telepon: telepon ?? null },
    select: { id: true, nama: true, email: true, role: true, nim: true, createdAt: true },
  });

  await createAuditLog({
    userId: user.id,
    aksi: "REGISTER",
    detail: `New PASIEN account registered`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken, refreshJti } = generateTokens(user.id, user.email, user.role);

  // Stage 2: store refresh token hash in DB
  await storeRefreshToken(user.id, refreshJti, refreshToken);

  // Stage 2: set httpOnly cookies instead of returning tokens in body
  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: "Akun berhasil dibuat.",
    data: {
      user,
      // Still return tokens for non-browser clients (mobile, Postman)
      accessToken,
      refreshToken,
    },
  });
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: "Validasi gagal.", errors: errors.mapped() });
    return;
  }

  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  const INVALID_MSG = "Email atau password salah.";

  if (!user) {
    await createAuditLog({ aksi: "LOGIN_FAILED", detail: `Failed login attempt`, ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    throw new AppError(401, INVALID_MSG);
  }

  // Stage 3: cek account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await createAuditLog({ userId: user.id, aksi: "LOGIN_BLOCKED", detail: `Account locked until ${user.lockedUntil}`, ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    throw new AppError(423, "Akun terkunci sementara. Coba lagi nanti.");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    // Stage 3: increment failedLoginAttempts
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const lockThreshold = 5;
    const lockDuration = 15 * 60 * 1000; // 15 menit

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        lockedUntil: newFailedAttempts >= lockThreshold
          ? new Date(Date.now() + lockDuration)
          : null,
      },
    });

    await createAuditLog({
      userId: user.id,
      aksi: "LOGIN_FAILED",
      detail: `Wrong password (attempt ${newFailedAttempts}/${lockThreshold})`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (newFailedAttempts >= lockThreshold) {
      throw new AppError(423, "Terlalu banyak percobaan gagal. Akun dikunci 15 menit.");
    }
    throw new AppError(401, INVALID_MSG);
  }

  // Stage 3: reset counter on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  await createAuditLog({
    userId: user.id,
    aksi: "LOGIN_SUCCESS",
    detail: `Login from ${req.ip}`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken, refreshJti } = generateTokens(user.id, user.email, user.role);

  // Stage 2: store refresh token + set cookies
  await storeRefreshToken(user.id, refreshJti, refreshToken);
  setAuthCookies(res, accessToken, refreshToken);

  const safeUser = { id: user.id, nama: user.nama, email: user.email, role: user.role, nim: user.nim, nip: user.nip, telepon: user.telepon };

  res.status(200).json({
    success: true,
    message: "Login berhasil.",
    data: { user: safeUser, accessToken, refreshToken },
  });
}

/** POST /api/auth/logout */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  if (req.user) {
    // Stage 2: revoke current refresh token (all devices = revokeAllUserTokens)
    if (req.user.jti) {
      await revokeRefreshToken(req.user.jti);
    }

    await createAuditLog({
      userId: req.user.userId,
      aksi: "LOGOUT",
      detail: `User logged out`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  // Stage 2: clear httpOnly cookies
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: "Logout berhasil." });
}

/** POST /api/auth/logout-all — revoke semua session */
export async function logoutAll(req: AuthRequest, res: Response): Promise<void> {
  if (req.user) {
    await revokeAllUserTokens(req.user.userId);
    await createAuditLog({
      userId: req.user.userId,
      aksi: "LOGOUT",
      detail: `User logged out from ALL devices`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  clearAuthCookies(res);
  res.status(200).json({ success: true, message: "Logout dari semua perangkat berhasil." });
}

/** POST /api/auth/refresh — Token Rotation */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  // Stage 2: baca dari cookie atau body
  const token = req.cookies?.refreshToken || (req.body as { refreshToken?: string }).refreshToken;

  if (!token) throw new AppError(400, "Refresh token diperlukan.");

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
      algorithms: ["HS256"],
      issuer: "medcampus-api",
      audience: "medcampus-refresh",
    }) as { jti: string; userId: string; email: string; role: string };

    // Stage 2: cek apakah token sudah di-revoke (blacklist check)
    const revoked = await isTokenRevoked(payload.jti);
    if (revoked) throw new AppError(401, "Refresh token tidak valid.");

    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new AppError(401, "Akun tidak ditemukan.");

    // Stage 2: Token Rotation — revoke lama, issue baru
    await revokeRefreshToken(payload.jti);

    const { accessToken, refreshToken: newRefreshToken, refreshJti } = generateTokens(user.id, user.email, user.role);
    await storeRefreshToken(user.id, refreshJti, newRefreshToken);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: "Token diperbarui.",
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "Refresh token tidak valid atau kedaluwarsa.");
  }
}

/** GET /api/auth/me */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, nama: true, email: true, role: true, nim: true, nip: true, telepon: true, golDarah: true, alergi: true, createdAt: true },
  });

  if (!user) throw new AppError(404, "User tidak ditemukan.");
  res.status(200).json({ success: true, data: user });
}

/** PUT /api/auth/change-password — Stage 3 */
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

  if (!oldPassword || !newPassword) throw new AppError(400, "Password lama dan baru wajib diisi.");
  if (newPassword.length < 8) throw new AppError(400, "Password baru minimal 8 karakter.");
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    throw new AppError(400, "Password baru harus mengandung huruf besar, huruf kecil, dan angka.");
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError(404, "User tidak ditemukan.");

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new AppError(401, "Password lama tidak benar.");

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  // Revoke semua refresh token — paksa login ulang di semua device
  await revokeAllUserTokens(user.id);
  clearAuthCookies(res);

  await createAuditLog({
    userId: user.id,
    aksi: "PASSWORD_CHANGED",
    detail: `Password changed — all sessions revoked`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({ success: true, message: "Password berhasil diubah. Silakan login ulang." });
}
