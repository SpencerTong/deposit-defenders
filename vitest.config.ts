import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Match Next.js: automatic JSX runtime (no React import needed) and the
  // "@/..." path alias from tsconfig.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
