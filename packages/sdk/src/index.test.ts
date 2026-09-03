import { afterEach, describe, expect, it } from "vitest";
import { resolveGuideRequest } from "./index.js";

const originalLocation = window.location;

function setLocation(url: string) {
  Object.defineProperty(window, "location", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
}

describe("resolveGuideRequest", () => {
  afterEach(() => {
    Object.defineProperty(window, "location", { value: originalLocation, configurable: true });
  });

  it("returns null when no guide has been requested", () => {
    setLocation("http://localhost:3001/payments/new");
    expect(resolveGuideRequest({})).toBeNull();
  });

  it("builds a guide URL from query params", () => {
    setLocation("http://localhost:3001/payments/new?trail=PAY-1245&release=2026.08.26");
    const result = resolveGuideRequest({});
    expect(result).toEqual({
      url: "/guides/releases/2026.08.26/PAY-1245.json",
      guideId: "PAY-1245",
      release: "2026.08.26",
    });
  });

  it("respects a custom guideBaseUrl", () => {
    setLocation("http://localhost:3001/payments/new?trail=PAY-1245&release=2026.08.26");
    const result = resolveGuideRequest({ guideBaseUrl: "https://cdn.example.com/guides/" });
    expect(result?.url).toBe("https://cdn.example.com/guides/releases/2026.08.26/PAY-1245.json");
  });

  it("prefers an explicit guideUrl override", () => {
    setLocation("http://localhost:3001/payments/new");
    const result = resolveGuideRequest({ guideUrl: "/custom/guide.json?trail=X&release=Y" });
    expect(result).toEqual({ url: "/custom/guide.json?trail=X&release=Y", guideId: "X", release: "Y" });
  });
});
