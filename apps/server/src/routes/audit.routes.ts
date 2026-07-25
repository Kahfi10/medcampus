import { Router, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/", async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = "1", limit = "20", aksi } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where = aksi ? { aksi } : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: { user: { select: { nama: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
});

export default router;
