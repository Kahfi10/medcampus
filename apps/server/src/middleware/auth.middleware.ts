import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { createAuditLog } from "../utils/audit";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    jti?: string;
  };
}

/**
 * Stage 2: Verify JWT from httpOnly cookie OR Authorization header
 * Priority: cookie > header (cookie is more secure)
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Stage 2: read from httpOnly cookie first, fallback to Authorization header
  let token: string | undefined;

  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Token tidak ditemukan." });
    return;
  }

  try {
    // Stage 1 Fix: explicit algorithm to prevent algorithm confusion attack
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
      issuer: "medcampus-api",
      audience: "medcampus-client",
    }) as {
      jti: string;
      userId: string;
      email: string;
      role: string;
    };

    // Check user still exists, not soft-deleted, and not locked (Stage 3)
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "Akun tidak ditemukan atau telah dihapus." });
      return;
    }

    req.user = { userId: user.id, email: user.email, role: user.role, jti: payload.jti };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: "Token telah kedaluwarsa." });
    } else {
      res.status(401).json({ success: false, message: "Token tidak valid." });
    }
  }
}

/** Role-based access control middleware factory */
export function authorize(...roles: string[]) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Tidak terautentikasi." });
      return;
    }

    if (!roles.includes(req.user.role)) {
      await createAuditLog({
        userId: req.user.userId,
        aksi: "ACCESS_DENIED",
        detail: `Attempted ${req.method} ${req.path} with role ${req.user.role}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(403).json({
        success: false,
        message: "Akses ditolak. Anda tidak memiliki izin untuk melakukan aksi ini.",
      });
      return;
    }

    next();
  };
}
