import { defineConfig } from "vite";
import { guideDevServerPlugin } from "../../scripts/vite-guide-plugin";

export default defineConfig({
  plugins: [guideDevServerPlugin()],
  server: { port: 3002 },
  preview: { port: 3002 },
});
