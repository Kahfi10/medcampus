import { Router, Response } from "express";
import { body, param, query } from "express-validator";
import { validationResult } from "express-validator";
import { prisma } from "../utils/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../utils/audit";
import { AppError } from "../middleware/error.middleware";
import bcrypt from "bcryptjs";

const router = Router();
router.use(authenticate);

/** GET /api/users — ADMIN only */
router.get("/", authorize("ADMIN"), async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = "1", limit = "10", role, search } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      deletedAt: null,
      ...(role ? { role: role as never } : {}),
      ...(search
        ? {
            OR: [
              { nama: { contains: search } },
              { email: { contains: search } },
              { nim: { contains: search } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: { id: true, nama: true, email: true, role: true, nim: true, nip: true, telepon: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
});

/** POST /api/users — ADMIN creates DOKTER account */
router.post(
  "/",
  authorize("ADMIN"),
  [
    body("nama").trim().notEmpty().withMessage("Nama wajib diisi."),
    body("email").trim().isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("role").isIn(["DOKTER", "ADMIN"]).withMessage("Role harus DOKTER atau ADMIN."),
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) { res.status(422).json({ success: false, errors: errors.mapped() }); return; }

      const { nama, email, password, role, nip, telepon } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new AppError(409, "Email sudah terdaftar.");

      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { nama, email, password: hashed, role, nip: nip ?? null, telepon: telepon ?? null },
        select: { id: true, nama: true, email: true, role: true },
      });

      await createAuditLog({ userId: req.user!.userId, aksi: "USER_CREATED", detail: `Created ${role}: ${email}`, ipAddress: req.ip });
      res.status(201).json({ success: true, message: "Akun berhasil dibuat.", data: user });
    } catch (err) { next(err); }
  }
);

/** GET /api/users/:id */
router.get("/:id", async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    // Non-admin can only view own profile
    if (req.user!.role !== "ADMIN" && req.user!.userId !== id) {
      throw new AppError(403, "Akses ditolak.");
    }

    const user = await prisma.user.findFirst({
      where: { id: id as string, deletedAt: null },
      select: { id: true, nama: true, email: true, role: true, nim: true, nip: true, telepon: true, golDarah: true, alergi: true, createdAt: true },
    });
    if (!user) throw new AppError(404, "User tidak ditemukan.");

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

/** PUT /api/users/:id */
router.put(
  "/:id",
  [
    body("nama").optional().trim().isLength({ min: 2, max: 100 }),
    body("telepon").optional().trim(),
    body("golDarah").optional().trim().isIn(["A", "B", "AB", "O", ""]),
    body("alergi").optional().trim(),
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { id } = req.params;
      if (req.user!.role !== "ADMIN" && req.user!.userId !== id) {
        throw new AppError(403, "Akses ditolak.");
      }

      const { nama, telepon, golDarah, alergi, nim, nip } = req.body;
      const user = await prisma.user.update({
        where: { id: id as string },
        data: {
          ...(nama !== undefined ? { nama } : {}),
          ...(telepon !== undefined ? { telepon } : {}),
          ...(golDarah !== undefined ? { golDarah } : {}),
          ...(alergi !== undefined ? { alergi } : {}),
          ...(nim !== undefined ? { nim } : {}),
          ...(nip !== undefined ? { nip } : {}),
        },
        select: { id: true, nama: true, email: true, role: true, nim: true, telepon: true, golDarah: true, alergi: true },
      });

      await createAuditLog({ userId: req.user!.userId, aksi: "USER_UPDATED", detail: `Updated user: ${id}`, ipAddress: req.ip });
      res.json({ success: true, message: "Profil berhasil diperbarui.", data: user });
    } catch (err) { next(err); }
  }
);

/** DELETE /api/users/:id — soft delete, ADMIN only */
router.delete("/:id", authorize("ADMIN"), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    if (id === req.user!.userId) throw new AppError(400, "Tidak dapat menghapus akun sendiri.");

    await prisma.user.update({ where: { id: id as string }, data: { deletedAt: new Date() } });
    await createAuditLog({ userId: req.user!.userId, aksi: "USER_DELETED", detail: `Soft-deleted user: ${id}`, ipAddress: req.ip });

    res.json({ success: true, message: "Akun berhasil dihapus." });
  } catch (err) { next(err); }
});

export default router;

