import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { guideDevServerPlugin } from "../../scripts/vite-guide-plugin";

export default defineConfig({
  plugins: [react(), guideDevServerPlugin()],
  server: { port: 3001 },
  preview: { port: 3001 },
});
