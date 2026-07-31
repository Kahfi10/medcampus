import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import kunjunganRoutes from "./routes/kunjungan.routes";
import rekamMedisRoutes from "./routes/rekam-medis.routes";
import obatRoutes from "./routes/obat.routes";
import auditRoutes from "./routes/audit.routes";
import healthRoutes from "./routes/health.routes";

const app = express();

// ─── Stage 1 Fix: Trust proxy — WAJIB agar rate limiter & IP logging
// bekerja dengan benar di balik Nginx reverse proxy.
// Tanpa ini, req.ip selalu "127.0.0.1" dan rate limiter tidak berfungsi di production.
app.set("trust proxy", 1);

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Stage 5 TODO: hapus 'unsafe-inline' — butuh nonce/hash untuk Tailwind inline styles
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        // Stage 1 Fix: tambah directive yang hilang
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    // Pastikan X-Powered-By tersembunyi
    hidePoweredBy: true,
  })
);

// ─── Stage 1 Fix: HPP — HTTP Parameter Pollution protection ───────────────────
// Mencegah ?role=PASIEN&role=ADMIN dan sejenisnya
app.use(hpp());

// ─── CORS — whitelist only client origin ─────────────────────────────────────
const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN || "http://localhost:3000"
).split(",").map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Stage 1 Fix: hapus !origin — jangan izinkan request tanpa Origin header
      // (curl, server-to-server, Postman) melewati CORS di production
      if (process.env.NODE_ENV !== "production" && !origin) {
        // Dev: izinkan tanpa origin (Postman, lokal)
        callback(null, true);
      } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);

// ─── Global rate limiter ───────────────────────────────────────────────────────
// Stage 1 Fix: trust proxy sudah diset, jadi req.ip sekarang IP asli client
// Stage 8 TODO: ganti MemoryStore dengan Redis untuk multi-process safety
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan. Coba lagi nanti." },
  // Gunakan req.ip yang sudah benar karena trust proxy diset
  keyGenerator: (req) => req.ip || "unknown",
});
app.use(globalLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── HTTP logging — sanitize sensitive fields ─────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  // Stage 6 TODO: ganti dengan structured logger (pino/winston)
  // Gunakan "combined" di production untuk IP tracking yang lengkap
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/kunjungan", kunjunganRoutes);
app.use("/api/rekam-medis", rekamMedisRoutes);
app.use("/api/obat", obatRoutes);
app.use("/api/audit-log", auditRoutes);

// ─── 404 & Error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
