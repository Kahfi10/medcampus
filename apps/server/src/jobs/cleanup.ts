/**
 * Stage 6: Cleanup jobs
 * - Hapus expired refresh tokens
 * - Hapus audit logs lama (> 90 hari)
 * - Hapus account lockout yang sudah kedaluwarsa
 *
 * Panggil dari cron atau saat server startup
 */

import { prisma } from "../utils/prisma";
import { cleanupExpiredTokens } from "../utils/token";

export async function runCleanupJobs(): Promise<void> {
  const now = new Date();

  try {
    // 1. Hapus expired refresh tokens
    const tokenCount = await cleanupExpiredTokens();

    // 2. Hapus audit logs > 90 hari
    const cutoff90 = new Date(now);
    cutoff90.setDate(cutoff90.getDate() - 90);
    const logCount = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff90 } },
    });

    // 3. Reset lockout yang sudah expired
    const lockCount = await prisma.user.updateMany({
      where: {
        lockedUntil: { lt: now, not: null },
      },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });

    console.log(`[Cleanup] Tokens removed: ${tokenCount}, Logs removed: ${logCount.count}, Lockouts cleared: ${lockCount.count}`);
  } catch (err) {
    console.error("[Cleanup] Job failed:", err);
  }
}
