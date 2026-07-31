import { Router, Response, NextFunction } from "express";
import { body } from "express-validator";
import { validationResult } from "express-validator";
import { prisma } from "../utils/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../utils/audit";
import { AppError } from "../middleware/error.middleware";
import { encryptRekamMedis, decryptRekamMedis } from "../utils/encryption";

const router = Router();
router.use(authenticate);

/** GET /api/rekam-medis — ADMIN/DOKTER */
router.get("/", authorize("ADMIN", "DOKTER"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "10" } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where = req.user!.role === "DOKTER" ? { dokterId: req.user!.userId } : {};

    const [rawData, total] = await Promise.all([
      prisma.rekamMedis.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          dokter: { select: { nama: true } },
          kunjungan: { include: { pasien: { select: { nama: true, nim: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rekamMedis.count({ where }),
    ]);

    // Stage 4: dekripsi sebelum kirim ke client
    const data = rawData.map(r => decryptRekamMedis(r));

    res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

/** GET /api/rekam-medis/saya — PASIEN */
router.get("/saya", authorize("PASIEN"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawData = await prisma.rekamMedis.findMany({
      where: { kunjungan: { pasienId: req.user!.userId } },
      include: {
        dokter: { select: { nama: true } },
        kunjungan: { select: { tanggal: true, keluhan: true } },
        resepObat: { include: { obat: { select: { nama: true, satuan: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Stage 4: dekripsi
    const data = rawData.map(r => decryptRekamMedis(r));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

/** GET /api/rekam-medis/:id — with IDOR protection */
router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rekam = await prisma.rekamMedis.findUnique({
      where: { id: req.params.id as string },
      include: {
        dokter: { select: { nama: true } },
        kunjungan: { include: { pasien: { select: { id: true, nama: true, nim: true } } } },
        resepObat: { include: { obat: true } },
      },
    });
    if (!rekam) throw new AppError(404, "Rekam medis tidak ditemukan.");

    // IDOR protection
    if (req.user!.role === "PASIEN" && rekam.kunjungan?.pasien?.id !== req.user!.userId) {
      await createAuditLog({ userId: req.user!.userId, aksi: "ACCESS_DENIED", detail: `IDOR attempt on rekam-medis ${req.params.id}`, ipAddress: req.ip });
      throw new AppError(403, "Akses ditolak.");
    }

    await createAuditLog({ userId: req.user!.userId, aksi: "REKAM_MEDIS_ACCESSED", detail: `Accessed rekam-medis: ${req.params.id}`, ipAddress: req.ip });

    // Stage 4: dekripsi sebelum kirim
    res.json({ success: true, data: decryptRekamMedis(rekam) });
  } catch (err) { next(err); }
});

/** POST /api/rekam-medis — DOKTER */
router.post(
  "/",
  authorize("DOKTER"),
  [
    body("kunjunganId").notEmpty(),
    body("diagnosa").trim().notEmpty().isLength({ min: 3, max: 1000 }),
    body("tindakan").trim().notEmpty().isLength({ min: 3, max: 1000 }),
    body("catatan").optional().trim().isLength({ max: 2000 }),
    body("resepObat").optional().isArray(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) { res.status(422).json({ success: false, errors: errors.mapped() }); return; }

      const { kunjunganId, diagnosa, tindakan, catatan, resepObat } = req.body;

      const kunjungan = await prisma.kunjungan.findUnique({ where: { id: kunjunganId } });
      if (!kunjungan) throw new AppError(404, "Kunjungan tidak ditemukan.");
      if (kunjungan.status !== "DIPROSES") throw new AppError(400, "Kunjungan harus berstatus DIPROSES.");

      const existing = await prisma.rekamMedis.findUnique({ where: { kunjunganId } });
      if (existing) throw new AppError(409, "Rekam medis untuk kunjungan ini sudah ada.");

      if (resepObat?.length) {
        for (const r of resepObat as { obatId: string; jumlah: number }[]) {
          const obat = await prisma.obat.findUnique({ where: { id: r.obatId } });
          if (!obat) throw new AppError(404, `Obat tidak ditemukan.`);
          if (obat.stok < r.jumlah) throw new AppError(400, `Stok obat "${obat.nama}" tidak mencukupi.`);
        }
      }

      // Stage 4: enkripsi field sensitif sebelum simpan ke DB
      const encrypted = encryptRekamMedis({ diagnosa, tindakan, catatan });

      const rekam = await prisma.$transaction(async (tx) => {
        const created = await tx.rekamMedis.create({
          data: {
            kunjunganId,
            dokterId: req.user!.userId,
            diagnosa: encrypted.diagnosa,   // disimpan terenkripsi
            tindakan: encrypted.tindakan,
            catatan: encrypted.catatan ?? null,
            resepObat: resepObat?.length
              ? { create: resepObat.map((r: { obatId: string; jumlah: number; aturanPakai: string }) => ({ obatId: r.obatId, jumlah: r.jumlah, aturanPakai: r.aturanPakai })) }
              : undefined,
          },
          include: { resepObat: { include: { obat: true } } },
        });

        if (resepObat?.length) {
          for (const r of resepObat as { obatId: string; jumlah: number }[]) {
            await tx.obat.update({ where: { id: r.obatId }, data: { stok: { decrement: r.jumlah } } });
          }
        }

        await tx.kunjungan.update({ where: { id: kunjunganId }, data: { status: "SELESAI" } });
        return created;
      });

      await createAuditLog({ userId: req.user!.userId, aksi: "REKAM_MEDIS_CREATED", detail: `Created rekam-medis: ${rekam.id}`, ipAddress: req.ip });

      // Stage 4: dekripsi sebelum return ke client
      res.status(201).json({ success: true, message: "Rekam medis berhasil dibuat.", data: decryptRekamMedis(rekam) });
    } catch (err) { next(err); }
  }
);

export default router;
