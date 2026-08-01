import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

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
    // Git worktrees under .worktrees/ are full checkouts, so without this every
    // test runs twice. Worse, the "@" alias above always resolves to this repo
    // root, so a worktree copy's vi.mock() targets this checkout's module while
    // the code under test imports its own, and the mock silently misses.
    exclude: [...configDefaults.exclude, "**/.worktrees/**"],
  },
});
