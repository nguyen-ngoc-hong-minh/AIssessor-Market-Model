export const ACTIVE_CONVEX_URL = "https://perceptive-snake-642.convex.cloud";
export const ACTIVE_CONVEX_SITE_URL = "https://perceptive-snake-642.convex.site";

const RETIRED_CONVEX_URLS = new Set([
  "https://scrupulous-deer-129.convex.cloud",
]);

export function resolveConvexUrl(configuredUrl: string | undefined) {
  const normalized = configuredUrl?.trim().replace(/\/$/, "");
  if (!normalized || RETIRED_CONVEX_URLS.has(normalized)) return ACTIVE_CONVEX_URL;
  return normalized;
}
