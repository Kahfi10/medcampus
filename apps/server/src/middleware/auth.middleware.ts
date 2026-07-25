import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { createAuditLog } from "../utils/audit";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/** Verify JWT and attach user to request */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Token tidak ditemukan." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    // Check user still exists and not soft-deleted
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "Akun tidak ditemukan atau telah dihapus." });
      return;
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
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
      // Log access denied
      await createAuditLog({
        userId: req.user.userId,
        aksi: "ACCESS_DENIED",
        detail: `Attempted to access ${req.method} ${req.path} with role ${req.user.role}`,
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
