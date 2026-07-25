import "dotenv/config";
import app from "./app";
import { prisma } from "./utils/prisma";

const PORT = Number(process.env.PORT) || 5000;

async function main() {
  // Test DB connection
  await prisma.$connect();
  console.log("✓ Database connected");

  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`  API docs:    http://localhost:${PORT}/api-docs`);
    console.log(`  Health:      http://localhost:${PORT}/health`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
