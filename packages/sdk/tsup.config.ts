import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "es2019",
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    // Bundled + minified global build for plain HTML/JS pages with no module loader.
    entry: { index: "src/index.ts" },
    format: ["iife"],
    globalName: "TestGuideSDK",
    target: "es2019",
    dts: false,
    sourcemap: true,
    minify: true,
    clean: false,
    outExtension: () => ({ js: ".global.js" }),
  },
]);
