import { createHash, randomBytes } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { resolveConvexUrl } from "@/lib/convex-deployment";

export function createTrialToken() {
  return randomBytes(32).toString("base64url");
}

export function hashTrialToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicConvex() {
  return new ConvexHttpClient(resolveConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL));
}
