/**
 * Stage 6: Anomaly detection
 * Deteksi pola aktivitas mencurigakan dari AuditLog
 */

import { prisma } from "../utils/prisma";
import { createAuditLog } from "./audit";

interface AnomalyResult {
  detected: boolean;
  type?: string;
  detail?: string;
}

/**
 * Deteksi login gagal berlebihan dari satu IP dalam 15 menit
 * Threshold: > 20 percobaan dari IP yang sama
 */
export async function detectBruteForceByIP(ip: string): Promise<AnomalyResult> {
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);

  const count = await prisma.auditLog.count({
    where: {
      aksi: "LOGIN_FAILED",
      ipAddress: ip,
      createdAt: { gte: windowStart },
    },
  });

  if (count > 20) {
    await createAuditLog({
      aksi: "ANOMALY_DETECTED",
      detail: `Brute force detected from IP ${ip}: ${count} failed logins in 15 min`,
      ipAddress: ip,
    });
    return { detected: true, type: "BRUTE_FORCE_IP", detail: `${count} failed logins from ${ip}` };
  }

  return { detected: false };
}

/**
 * Deteksi akses rekam medis massal oleh satu user dalam 5 menit
 * Threshold: > 30 akses rekam medis
 */
export async function detectMassRecordAccess(userId: string): Promise<AnomalyResult> {
  const windowStart = new Date(Date.now() - 5 * 60 * 1000);

  const count = await prisma.auditLog.count({
    where: {
      userId,
      aksi: "REKAM_MEDIS_ACCESSED",
      createdAt: { gte: windowStart },
    },
  });

  if (count > 30) {
    await createAuditLog({
      userId,
      aksi: "ANOMALY_DETECTED",
      detail: `Mass record access by user ${userId}: ${count} accesses in 5 min`,
    });
    return { detected: true, type: "MASS_RECORD_ACCESS", detail: `${count} accesses` };
  }

  return { detected: false };
}

/**
 * Deteksi akses dari banyak IP berbeda untuk user yang sama
 * Threshold: > 3 IP berbeda dalam 1 jam
 */
export async function detectMultipleIPAccess(userId: string): Promise<AnomalyResult> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000);

  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      aksi: "LOGIN_SUCCESS",
      createdAt: { gte: windowStart },
    },
    select: { ipAddress: true },
  });

  const uniqueIPs = new Set(logs.map(l => l.ipAddress).filter(Boolean));

  if (uniqueIPs.size > 3) {
    await createAuditLog({
      userId,
      aksi: "ANOMALY_DETECTED",
      detail: `Multiple IP access: ${[...uniqueIPs].join(", ")} in 1 hour`,
    });
    return { detected: true, type: "MULTIPLE_IP_ACCESS", detail: `${uniqueIPs.size} unique IPs` };
  }

  return { detected: false };
}
