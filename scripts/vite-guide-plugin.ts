import type { Plugin } from "vite";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseAuthorGuideYaml, resolveGuide, type AuthorGuide } from "@trail/guide-schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const GUIDES_ROOT = path.resolve(here, "../guides/releases");

/**
 * Dev-only Vite middleware that serves `guides/releases/<release>/<id>.yaml` as
 * validated JSON, so `pnpm dev` works without a separate `trail build` step.
 * The real static JSON assets are produced by the CLI for deployment.
 */
export function guideDevServerPlugin(): Plugin {
  return {
    name: "trail-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/guides\/releases\/([^/]+)\/([^/]+)\.json(?:\?.*)?$/);
        if (!match) {
          next();
          return;
        }

        const [, release, guideId] = match as [string, string, string];
        const releasePath = path.join(GUIDES_ROOT, release);
        const filePath = path.join(releasePath, `${guideId}.yaml`);
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

        const guideFiles = await readdir(releasePath);
        const parsedGuides = await Promise.all(
          guideFiles
            .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
            .map(async (file) => ({
              file,
              result: parseAuthorGuideYaml(await readFile(path.join(releasePath, file), "utf-8")),
            })),
        );
        const requested = parsedGuides.find((entry) => entry.file === `${guideId}.yaml`);
        const authorGuides = new Map<string, AuthorGuide>();
        for (const { result } of parsedGuides) {
          if (result.success) authorGuides.set(result.guide.id, result.guide);
        }
        const result = requested?.result.success
          ? resolveGuide(requested.result.guide, authorGuides)
          : requested?.result;

        if (!result || !result.success) {
          res.statusCode = 422;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid guide", issues: result?.issues }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result.guide));
      });
    },
  };
}
