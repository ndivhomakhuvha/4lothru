import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { guideDevServerPlugin } from "../../scripts/vite-guide-plugin";

export default defineConfig({
  plugins: [react(), guideDevServerPlugin()],
  // workspace packages rebuild their own dist via `tsup --watch`; excluding them
  // from dep pre-bundling stops Vite serving a stale cached bundle on edit.
  optimizeDeps: { exclude: ["@trail/sdk", "@trail/guide-schema"] },
  server: { port: 3001, strictPort: true },
  preview: { port: 3001 },
});