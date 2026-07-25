import { prisma } from "./prisma";

type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "ACCESS_DENIED"
  | "REKAM_MEDIS_ACCESSED"
  | "REKAM_MEDIS_CREATED"
  | "REKAM_MEDIS_UPDATED"
  | "KUNJUNGAN_CREATED"
  | "KUNJUNGAN_STATUS_UPDATED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "ROLE_CHANGED"
  | "PASSWORD_CHANGED"
  | "OBAT_CREATED"
  | "OBAT_UPDATED"
  | string;

interface AuditOptions {
  userId?: string;
  aksi: AuditAction;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(opts: AuditOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        aksi: opts.aksi,
        detail: opts.detail ?? null,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit logging should never crash the app
    console.error("[AuditLog] Failed to write:", err);
  }
}
