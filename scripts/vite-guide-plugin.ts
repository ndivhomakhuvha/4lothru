import type { Plugin } from "vite";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGuideYaml } from "@test-guide/guide-schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const GUIDES_ROOT = path.resolve(here, "../guides/releases");

/**
 * Dev-only Vite middleware that serves `guides/releases/<release>/<id>.yaml` as
 * validated JSON, so `pnpm dev` works without a separate `test-guide build` step.
 * The real static JSON assets are produced by the CLI for deployment.
 */
export function guideDevServerPlugin(): Plugin {
  return {
    name: "test-guide-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/guides\/releases\/([^/]+)\/([^/]+)\.json(?:\?.*)?$/);
        if (!match) {
          next();
          return;
        }

        const [, release, guideId] = match as [string, string, string];
        const filePath = path.join(GUIDES_ROOT, release, `${guideId}.yaml`);
        const origin = req.headers.origin;

        if (origin === "http://localhost:4200") {
          res.setHeader("Access-Control-Allow-Origin", origin);
        }

        if (!existsSync(filePath)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Guide not found" }));
          return;
        }

        const yamlText = await readFile(filePath, "utf-8");
        const result = parseGuideYaml(yamlText);

        if (!result.success) {
          res.statusCode = 422;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid guide", issues: result.issues }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result.guide));
      });
    },
  };
}
