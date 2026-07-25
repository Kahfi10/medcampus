import { Router, Response, NextFunction } from "express";
import { body } from "express-validator";
import { validationResult } from "express-validator";
import { prisma } from "../utils/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../utils/audit";

const router = Router();
router.use(authenticate);

const obatValidation = [
  body("nama").trim().notEmpty().withMessage("Nama obat wajib diisi.").isLength({ max: 150 }),
  body("satuan").trim().notEmpty().withMessage("Satuan wajib diisi.").isLength({ max: 30 }),
  body("stok").isInt({ min: 0 }).withMessage("Stok harus angka positif."),
];

router.get("/", async (_req: AuthRequest, res: Response, next) => {
  try {
    const obat = await prisma.obat.findMany({
      where: { deletedAt: null },
      orderBy: { nama: "asc" },
    });
    res.json({ success: true, data: obat });
  } catch (err) { next(err); }
});

router.post("/", authorize("ADMIN", "DOKTER"), obatValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(422).json({ success: false, errors: errors.mapped() }); return; }

    const { nama, satuan, stok } = req.body;
    const obat = await prisma.obat.create({ data: { nama, satuan, stok: Number(stok) } });
    await createAuditLog({ userId: req.user!.userId, aksi: "OBAT_CREATED", detail: `Created obat: ${obat.nama}`, ipAddress: req.ip });
    res.status(201).json({ success: true, data: obat });
  } catch (err) { next(err); }
});

// HIGH-01 fix: validate PUT body, explicit field destructuring
router.put("/:id", authorize("ADMIN", "DOKTER"), obatValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(422).json({ success: false, errors: errors.mapped() }); return; }

    const { nama, satuan, stok } = req.body;
    const obat = await prisma.obat.update({
      where: { id: req.params.id as string },
      data: { nama, satuan, stok: Number(stok) }, // explicit fields — no req.body spread
    });
    await createAuditLog({ userId: req.user!.userId, aksi: "OBAT_UPDATED", detail: `Updated obat: ${obat.nama}`, ipAddress: req.ip });
    res.json({ success: true, data: obat });
  } catch (err) { next(err); }
});

// HIGH-02 fix: add audit log on delete
router.delete("/:id", authorize("ADMIN"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const obat = await prisma.obat.update({
      where: { id: req.params.id as string },
      data: { deletedAt: new Date() },
    });
    await createAuditLog({
      userId: req.user!.userId,
      aksi: "OBAT_DELETED",
      detail: `Soft-deleted obat: ${obat.nama} (${obat.id})`,
      ipAddress: req.ip,
    });
    res.json({ success: true, message: "Obat berhasil dihapus." });
  } catch (err) { next(err); }
});

export default router;

