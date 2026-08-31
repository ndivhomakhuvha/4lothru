import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { guideDevServerPlugin } from "../../scripts/vite-guide-plugin";

export default defineConfig({
  plugins: [react(), guideDevServerPlugin()],
  server: { port: 5173 },
  preview: { port: 5173 },
});
