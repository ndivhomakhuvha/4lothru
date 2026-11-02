import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { guideDevServerPlugin } from "../../scripts/vite-guide-plugin";

export default defineConfig({
  plugins: [react(), guideDevServerPlugin()],
  // workspace packages rebuild their own dist via `tsup --watch`; excluding them
  // from dep pre-bundling stops Vite serving a stale cached bundle on edit.
  optimizeDeps: { exclude: ["@4lothru/sdk", "@4lothru/guide-schema"] },
  server: {
    port: 5173,
    strictPort: true,
    cors: {
      origin: "http://localhost:4200",
    },
  },
  preview: { port: 5173 },
});
