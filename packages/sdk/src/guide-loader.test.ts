import { afterEach, describe, expect, it, vi } from "vitest";
import { loadGuide } from "./guide-loader.js";

const validGuideJson = JSON.stringify({
  id: "PAY-1245",
  title: "Create a Payment",
  application: "demo-bank",
  release: "2026.08.26",
  start: { url: "http://localhost:3001/payments/new" },
  steps: [
    {
      id: "submit",
      action: "click",
      target: { testId: "submit-payment" },
      instruction: "Submit the payment.",
    },
  ],
});

describe("loadGuide", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and validates a JSON guide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(validGuideJson, { status: 200 })),
    );
    const result = await loadGuide("/guides/releases/2026.08.26/PAY-1245.json");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.guide.id).toBe("PAY-1245");
    }
  });

  it("reports not-found for a 404 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));
    const result = await loadGuide("/guides/releases/2026.08.26/MISSING.json");
    expect(result).toEqual({ success: false, kind: "not-found" });
  });

  it("reports a network error when the request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await loadGuide("/guides/releases/2026.08.26/PAY-1245.json");
    expect(result).toEqual({ success: false, kind: "network-error" });
  });

  it("reports a server error for a non-404 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    const result = await loadGuide("/guides/releases/2026.08.26/PAY-1245.json");
    expect(result).toEqual({ success: false, kind: "server-error" });
  });

  it("reports invalid for a malformed guide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "X" }), { status: 200 })),
    );
    const result = await loadGuide("/guides/releases/2026.08.26/PAY-1245.json");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.kind).toBe("invalid");
      expect(result.issues?.length).toBeGreaterThan(0);
    }
  });
});
