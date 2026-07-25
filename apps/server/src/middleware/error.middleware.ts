import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/** 404 handler — must be placed after all routes */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan.`,
  });
}

/** Global error handler — must be last middleware */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log full error to server — NEVER to client
  if (process.env.NODE_ENV !== "production") {
    console.error("[Error]", err);
  } else {
    console.error("[Error]", err.message);
  }

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma known errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as unknown as { code: string };
    if (prismaErr.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Data sudah ada. Gunakan data yang berbeda.",
      });
      return;
    }
    if (prismaErr.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Data tidak ditemukan.",
      });
      return;
    }
  }

  // Generic — never expose stack trace to client
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
  });
}
