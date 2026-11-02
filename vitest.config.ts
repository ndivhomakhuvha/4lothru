import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // scripts/ is not a workspace package, so root-level tests resolve the
      // workspace schema package via this alias instead of node_modules.
      "@4lothru/guide-schema": path.resolve(here, "packages/guide-schema/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/*/src/**/*.test.tsx",
      "scripts/**/*.test.ts",
    ],
  },
});
