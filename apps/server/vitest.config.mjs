import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "src/__tests__", "prisma"],
    },
    testTimeout: 15000,
    hookTimeout: 30000,
    // Vitest 4: pool options di top level
    singleFork: true,
  },
});
