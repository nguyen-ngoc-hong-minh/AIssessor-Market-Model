import { describe, expect, it } from "vitest";
import { ACTIVE_CONVEX_URL, resolveConvexUrl } from "@/lib/convex-deployment";

describe("Convex deployment migration", () => {
  it("uses the active deployment when the host has no Convex setting", () => {
    expect(resolveConvexUrl(undefined)).toBe(ACTIVE_CONVEX_URL);
  });

  it("redirects the retired deployment to the active deployment", () => {
    expect(resolveConvexUrl("https://scrupulous-deer-129.convex.cloud/"))
      .toBe(ACTIVE_CONVEX_URL);
  });

  it("keeps an explicitly configured non-retired deployment", () => {
    expect(resolveConvexUrl("https://example.convex.cloud/"))
      .toBe("https://example.convex.cloud");
  });
});
