import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { setup2FA, verify2FA, disable2FA } from "../controllers/twofa.controller";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);

/** POST /api/2fa/setup */
router.post("/setup",
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(setup2FA(req as AuthRequest, res)).catch(next));

/** POST /api/2fa/verify */
router.post("/verify",
  [body("token").notEmpty().isLength({ min: 6, max: 6 }).isNumeric().withMessage("Token harus 6 digit angka.")],
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(verify2FA(req as AuthRequest, res)).catch(next));

/** POST /api/2fa/disable */
router.post("/disable",
  [body("token").notEmpty().isNumeric()],
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(disable2FA(req as AuthRequest, res)).catch(next));

export default router;
