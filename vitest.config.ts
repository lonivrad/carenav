import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // Playwright a11y specs live in e2e/ and run via `npm run test:a11y`,
    // not under vitest — keep vitest's default *.spec.ts glob from grabbing them.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
