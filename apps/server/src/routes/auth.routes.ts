import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import {
  register, login, logout, logoutAll,
  refreshToken, getMe, changePassword,
} from "../controllers/auth.controller";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
  message: { success: false, message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
  message: { success: false, message: "Terlalu banyak percobaan pendaftaran. Coba lagi dalam 1 jam." },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
  message: { success: false, message: "Terlalu banyak permintaan refresh token." },
});

// ─── Validation ──────────────────────────────────────────────────────────────

const registerValidation = [
  body("nama").trim().notEmpty().isLength({ min: 2, max: 100 }),
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("password")
    .notEmpty().isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password harus mengandung huruf besar, huruf kecil, dan angka."),
  body("nim").optional().trim().isLength({ max: 20 }),
  body("telepon").optional().trim().isMobilePhone("id-ID"),
];

const loginValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

const changePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Password lama wajib diisi."),
  body("newPassword")
    .notEmpty().isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password baru harus mengandung huruf besar, huruf kecil, dan angka."),
];

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post("/register", registerLimiter, registerValidation,
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(register(req, res)).catch(next));

router.post("/login", loginLimiter, loginValidation,
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(login(req, res)).catch(next));

router.post("/logout", authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(logout(req as AuthRequest, res)).catch(next));

// Stage 2: logout dari semua perangkat
router.post("/logout-all", authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(logoutAll(req as AuthRequest, res)).catch(next));

router.post("/refresh", refreshLimiter,
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(refreshToken(req, res)).catch(next));

router.get("/me", authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(getMe(req as AuthRequest, res)).catch(next));

// Stage 3: change password
router.put("/change-password", authenticate, changePasswordValidation,
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(changePassword(req as AuthRequest, res)).catch(next));

export default router;
