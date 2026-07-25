import { Router, Response } from "express";
import { body } from "express-validator";
import { validationResult } from "express-validator";
import { prisma } from "../utils/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../utils/audit";
import { AppError } from "../middleware/error.middleware";

const router = Router();
router.use(authenticate);

router.get("/", async (_req: AuthRequest, res: Response, next) => {
  try {
    const obat = await prisma.obat.findMany({
      where: { deletedAt: null },
      orderBy: { nama: "asc" },
    });
    res.json({ success: true, data: obat });
  } catch (err) { next(err); }
});

router.post("/", authorize("ADMIN", "DOKTER"), [
  body("nama").trim().notEmpty(),
  body("satuan").trim().notEmpty(),
  body("stok").isInt({ min: 0 }),
], async (req: AuthRequest, res: Response, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(422).json({ success: false, errors: errors.mapped() }); return; }

    const obat = await prisma.obat.create({ data: req.body });
    await createAuditLog({ userId: req.user!.userId, aksi: "OBAT_CREATED", detail: `Created obat: ${obat.nama}`, ipAddress: req.ip });
    res.status(201).json({ success: true, data: obat });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("ADMIN", "DOKTER"), async (req: AuthRequest, res: Response, next) => {
  try {
    const obat = await prisma.obat.update({ where: { id: req.params.id as string }, data: req.body });
    await createAuditLog({ userId: req.user!.userId, aksi: "OBAT_UPDATED", detail: `Updated obat: ${obat.id}`, ipAddress: req.ip });
    res.json({ success: true, data: obat });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("ADMIN"), async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.obat.update({ where: { id: req.params.id as string }, data: { deletedAt: new Date() } });
    res.json({ success: true, message: "Obat berhasil dihapus." });
  } catch (err) { next(err); }
});

export default router;

