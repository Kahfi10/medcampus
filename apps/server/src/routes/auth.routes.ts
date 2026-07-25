import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import { register, login, logout, refreshToken, getMe } from "../controllers/auth.controller";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

/** Strict rate limit for auth endpoints — brute force protection */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  },
});

// ─── Validation schemas ──────────────────────────────────────────────────────
const registerValidation = [
  body("nama")
    .trim()
    .notEmpty().withMessage("Nama wajib diisi.")
    .isLength({ min: 2, max: 100 }).withMessage("Nama harus 2–100 karakter."),
  body("email")
    .trim()
    .notEmpty().withMessage("Email wajib diisi.")
    .isEmail().withMessage("Format email tidak valid.")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password wajib diisi.")
    .isLength({ min: 8 }).withMessage("Password minimal 8 karakter.")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password harus mengandung huruf besar, huruf kecil, dan angka."),
  body("nim")
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage("NIM maksimal 20 karakter."),
  body("telepon")
    .optional()
    .trim()
    .isMobilePhone("id-ID").withMessage("Format nomor telepon tidak valid."),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email wajib diisi.")
    .isEmail().withMessage("Format email tidak valid.")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password wajib diisi."),
];

// ─── Routes ──────────────────────────────────────────────────────────────────

/** POST /api/auth/register */
router.post("/register", registerValidation, (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(register(req, res)).catch(next);
});

/** POST /api/auth/login  — rate limited */
router.post("/login", authLimiter, loginValidation, (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(login(req, res)).catch(next);
});

/** POST /api/auth/logout */
router.post("/logout", authenticate, (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(logout(req as AuthRequest, res)).catch(next);
});

/** POST /api/auth/refresh */
router.post("/refresh", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(refreshToken(req, res)).catch(next);
});

/** GET /api/auth/me */
router.get("/me", authenticate, (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(getMe(req as AuthRequest, res)).catch(next);
});

export default router;
