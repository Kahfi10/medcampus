import { Router, Response, NextFunction } from "express";
import { body } from "express-validator";
import { validationResult } from "express-validator";
import { prisma } from "../utils/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../utils/audit";
import { AppError } from "../middleware/error.middleware";

const router = Router();
router.use(authenticate);

/** GET /api/kunjungan — ADMIN/DOKTER */
router.get("/", authorize("ADMIN", "DOKTER"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = "1", limit = "10" } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(status ? { status: status as never } : {}) };

    const [kunjungan, total] = await Promise.all([
      prisma.kunjungan.findMany({
        where,
        skip,
        take: Number(limit),
        include: { pasien: { select: { id: true, nama: true, nim: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.kunjungan.count({ where }),
    ]);

    res.json({ success: true, data: kunjungan, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

/** GET /api/kunjungan/saya — PASIEN only */
router.get("/saya", authorize("PASIEN"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kunjungan = await prisma.kunjungan.findMany({
      where: { pasienId: req.user!.userId },
      include: { rekamMedis: { select: { id: true, diagnosa: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: kunjungan });
  } catch (err) { next(err); }
});

/** POST /api/kunjungan — PASIEN */
router.post(
  "/",
  authorize("PASIEN"),
  [
    body("tanggal").notEmpty().isISO8601().withMessage("Tanggal tidak valid."),
    body("keluhan").trim().notEmpty().isLength({ min: 5, max: 500 }).withMessage("Keluhan harus 5–500 karakter."),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) { res.status(422).json({ success: false, errors: errors.mapped() }); return; }

      // Business rule: max 1 active kunjungan per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await prisma.kunjungan.findFirst({
        where: {
          pasienId: req.user!.userId,
          status: { in: ["MENUNGGU", "DIPROSES"] },
          tanggal: { gte: today, lt: tomorrow },
        },
      });
      if (existing) throw new AppError(409, "Anda sudah memiliki kunjungan aktif hari ini.");

      const kunjungan = await prisma.kunjungan.create({
        data: { pasienId: req.user!.userId, tanggal: new Date(req.body.tanggal), keluhan: req.body.keluhan },
        include: { pasien: { select: { nama: true, nim: true } } },
      });

      await createAuditLog({ userId: req.user!.userId, aksi: "KUNJUNGAN_CREATED", detail: `Created kunjungan: ${kunjungan.id}`, ipAddress: req.ip });
      res.status(201).json({ success: true, message: "Kunjungan berhasil dibuat.", data: kunjungan });
    } catch (err) { next(err); }
  }
);

/** PUT /api/kunjungan/:id/status — DOKTER */
router.put("/:id/status", authorize("DOKTER"), [
  body("status").isIn(["DIPROSES", "SELESAI", "DIBATALKAN"]).withMessage("Status tidak valid."),
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(422).json({ success: false, errors: errors.mapped() }); return; }

    const kunjungan = await prisma.kunjungan.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status },
    });

    await createAuditLog({ userId: req.user!.userId, aksi: "KUNJUNGAN_STATUS_UPDATED", detail: `Kunjungan ${req.params.id} → ${req.body.status}`, ipAddress: req.ip });
    res.json({ success: true, message: "Status kunjungan diperbarui.", data: kunjungan });
  } catch (err) { next(err); }
});

/** DELETE /api/kunjungan/:id — PASIEN cancels own */
router.delete("/:id", authorize("PASIEN"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const kunjungan = await prisma.kunjungan.findUnique({ where: { id: req.params.id as string } });
    if (!kunjungan) throw new AppError(404, "Kunjungan tidak ditemukan.");

    // IDOR protection — pasien can only cancel their own
    if (kunjungan.pasienId !== req.user!.userId) {
      await createAuditLog({ userId: req.user!.userId, aksi: "ACCESS_DENIED", detail: `Attempted to delete kunjungan ${req.params.id}`, ipAddress: req.ip });
      throw new AppError(403, "Akses ditolak.");
    }

    if (kunjungan.status !== "MENUNGGU") throw new AppError(400, "Hanya kunjungan berstatus MENUNGGU yang dapat dibatalkan.");

    await prisma.kunjungan.update({ where: { id: req.params.id as string }, data: { status: "DIBATALKAN" } });
    res.json({ success: true, message: "Kunjungan berhasil dibatalkan." });
  } catch (err) { next(err); }
});

export default router;


