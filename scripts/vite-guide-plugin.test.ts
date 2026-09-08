import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { guideDevServerPlugin } from "./vite-guide-plugin";

const RELEASE = "2099.01.01";

function authorGuideYaml(id: string): string {
  return [
    `id: ${id}`,
    `title: ${id} title`,
    "application: demo-app",
    `release: ${RELEASE}`,
    "",
    "start:",
    "  url: http://localhost:3001/",
    "",
    "steps:",
    "  - id: go",
    "    target:",
    "      text: Go",
    "    action: click",
    "    instruction: Click go.",
    "",
  ].join("\n");
}

interface CapturedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string | undefined;
}

/** Invokes the plugin's middleware with a fake req/res and captures the response. */
function createHarness(guidesRoot: string): (url: string) => Promise<CapturedResponse> {
  let middleware:
    | ((req: unknown, res: unknown, next: () => void) => Promise<void>)
    | undefined;
  const plugin = guideDevServerPlugin(guidesRoot);
  const configure = plugin.configureServer;
  if (typeof configure !== "function") throw new Error("configureServer hook missing");
  configure.call({} as never, {
    middlewares: { use: (fn: typeof middleware) => (middleware = fn) },
  } as never);

  return async (url: string) => {
    const captured: CapturedResponse = { statusCode: 200, headers: {}, body: undefined };
    let nextCalled = false;
    await middleware!(
      { url, headers: {} },
      {
        setHeader(name: string, value: string) {
          captured.headers[name] = value;
        },
        end(body: string) {
          captured.body = body;
        },
        get statusCode() {
          return captured.statusCode;
        },
        set statusCode(value: number) {
          captured.statusCode = value;
        },
      },
      () => {
        nextCalled = true;
      },
    );
    if (nextCalled) throw new Error(`Request was not handled by the middleware: ${url}`);
    return captured;
  };
}

function setupGuides(): string {
  const guidesRoot = mkdtempSync(path.join(tmpdir(), "trail-guides-"));
  const releaseDir = path.join(guidesRoot, RELEASE);
  mkdirSync(releaseDir, { recursive: true });
  writeFileSync(path.join(releaseDir, "YML-GUIDE.yml"), authorGuideYaml("YML-GUIDE"));
  writeFileSync(path.join(releaseDir, "YAML-GUIDE.yaml"), authorGuideYaml("YAML-GUIDE"));
  return guidesRoot;
}

describe("guideDevServerPlugin", () => {
  it("serves a .yml guide as JSON, same as .yaml", async () => {
    const request = createHarness(setupGuides());

    const ymlResponse = await request(`/guides/releases/${RELEASE}/YML-GUIDE.json`);
    expect(ymlResponse.statusCode).toBe(200);
    expect(ymlResponse.headers["Content-Type"]).toBe("application/json");
    const ymlGuide = JSON.parse(ymlResponse.body!);
    expect(ymlGuide.id).toBe("YML-GUIDE");
    expect(ymlGuide.steps).toHaveLength(1);

    const yamlResponse = await request(`/guides/releases/${RELEASE}/YAML-GUIDE.json`);
    expect(yamlResponse.statusCode).toBe(200);
    const yamlGuide = JSON.parse(yamlResponse.body!);
    expect(yamlGuide.id).toBe("YAML-GUIDE");
    expect(yamlGuide.steps).toEqual(ymlGuide.steps);
  });

  it("returns 404 for a guide that exists in neither extension", async () => {
    const request = createHarness(setupGuides());
    const response = await request(`/guides/releases/${RELEASE}/NOPE.json`);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body!)).toEqual({ error: "Guide not found" });
  });
});
