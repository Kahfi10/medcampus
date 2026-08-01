import "dotenv/config";
import { beforeAll, afterAll } from "vitest";
import { prisma } from "../utils/prisma";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_jwt_32chars_minimum_ok_here";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_32chars_minimum_ok";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.CORS_ORIGIN = "http://localhost:4000";

export let dbAvailable = false;

beforeAll(async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
    console.log("[Test] Database connected");
  } catch {
    dbAvailable = false;
    console.warn("[Test] Database not available — DB-dependent tests will be skipped");
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await prisma.$disconnect();
  }
});
