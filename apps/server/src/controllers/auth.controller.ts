import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { prisma } from "../utils/prisma";
import { createAuditLog } from "../utils/audit";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";

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
    res.status(422).json({
      success: false,
      message: "Validasi gagal.",
      errors: errors.mapped(),
    });
    return;
  }

  const { nama, email, password, nim, telepon } = req.body as {
    nama: string;
    email: string;
    password: string;
    nim?: string;
    telepon?: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "Email sudah terdaftar. Gunakan email lain.");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      nama,
      email,
      password: hashedPassword,
      role: "PASIEN",
      nim: nim ?? null,
      telepon: telepon ?? null,
    },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      nim: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    userId: user.id,
    aksi: "REGISTER",
    detail: `New PASIEN account registered`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  res.status(201).json({
    success: true,
    message: "Akun berhasil dibuat.",
    data: { user, accessToken, refreshToken },
  });
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: "Validasi gagal.",
      errors: errors.mapped(),
    });
    return;
  }

  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  // Generic message — do NOT reveal whether email exists
  const INVALID_MSG = "Email atau password salah.";

  if (!user) {
    await createAuditLog({
      aksi: "LOGIN_FAILED",
      detail: `Failed login attempt`, // Stage 1 Fix: tidak log email untuk privacy
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    throw new AppError(401, INVALID_MSG);
  }

  // Stage 3 TODO: cek account lockout (lockedUntil, failedLoginAttempts)

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    await createAuditLog({
      userId: user.id,
      aksi: "LOGIN_FAILED",
      detail: `Wrong password`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    throw new AppError(401, INVALID_MSG);
  }

  await createAuditLog({
    userId: user.id,
    aksi: "LOGIN_SUCCESS",
    detail: `Login from ${req.ip}`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  const safeUser = {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    nim: user.nim,
    nip: user.nip,
    telepon: user.telepon,
  };

  res.status(200).json({
    success: true,
    message: "Login berhasil.",
    data: { user: safeUser, accessToken, refreshToken },
  });
}

/** POST /api/auth/logout */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  if (req.user) {
    await createAuditLog({
      userId: req.user.userId,
      aksi: "LOGOUT",
      detail: `User logged out`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  // Stage 2 TODO: blacklist the jti from the current token
  res.status(200).json({ success: true, message: "Logout berhasil." });
}

/** POST /api/auth/refresh */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken: string };

  if (!token) {
    throw new AppError(400, "Refresh token diperlukan.");
  }

  try {
    // Stage 1 Fix: verify with explicit algorithm
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
      algorithms: ["HS256"],
      issuer: "medcampus-api",
      audience: "medcampus-refresh",
    }) as {
      jti: string;
      userId: string;
      email: string;
      role: string;
    };

    // Stage 2 TODO: cek apakah jti sudah di-blacklist (token rotation)

    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError(401, "Akun tidak ditemukan.");
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role
    );

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
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      nim: true,
      nip: true,
      telepon: true,
      golDarah: true,
      alergi: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User tidak ditemukan.");
  }

  res.status(200).json({ success: true, data: user });
}
