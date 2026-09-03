import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { resolveConvexUrl } from "@/lib/convex-deployment";

const eventSchema = z.object({
  visitorId: z.string().min(16).max(100), sessionId: z.string().min(16).max(100),
  eventType: z.enum(["page_view", "engagement", "click", "form_submit"]),
  path: z.string().max(300), fromPath: z.string().max(300).optional(), toPath: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(), targetLabel: z.string().max(160).optional(), targetType: z.string().max(80).optional(),
  durationMs: z.number().finite().min(0).max(60_000).optional(), scrollDepth: z.number().finite().min(0).max(100).optional(),
});

function safePath(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value, "https://aissessor.invalid");
    return `${url.pathname}`.slice(0, 160);
  } catch { return value.startsWith("/") ? value.slice(0, 160) : undefined; }
}

function safeReferrer(value: string | undefined) {
  if (!value) return {};
  try {
    const url = new URL(value);
    return { referrerDomain: url.hostname.replace(/^www\./, "").slice(0, 120) };
  } catch { return {}; }
}

function decodeHeader(value: string | null) {
  if (!value) return undefined;
  try { return decodeURIComponent(value).slice(0, 120); } catch { return value.slice(0, 120); }
}

function clientType(userAgent: string) {
  const device = /ipad|tablet/i.test(userAgent) ? "Tablet" : /mobile|iphone|android/i.test(userAgent) ? "Mobile" : "Desktop";
  const browser = /edg\//i.test(userAgent) ? "Edge" : /firefox\//i.test(userAgent) ? "Firefox" : /chrome\//i.test(userAgent) ? "Chrome" : /safari\//i.test(userAgent) ? "Safari" : "Other";
  return { device, browser };
}

function digest(value: string) {
  const salt = process.env.ANALYTICS_HASH_SALT ?? process.env.CLERK_SECRET_KEY ?? "aissessor-first-party-analytics";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== new URL(request.url).host) return new Response(null, { status: 403 }); }
    catch { return new Response(null, { status: 403 }); }
  }
  if (/bot|crawler|spider|preview/i.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  const result = eventSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  const convexUrl = resolveConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);

  let clerkUserId: string | null = null;
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try { clerkUserId = (await auth()).userId; } catch { clerkUserId = null; }
  }
  const userAgent = request.headers.get("user-agent") ?? "";
  const location = {
    country: decodeHeader(request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry")),
    region: decodeHeader(request.headers.get("x-vercel-ip-country-region")),
    city: decodeHeader(request.headers.get("x-vercel-ip-city")),
  };
  const body = result.data;
  const client = new ConvexHttpClient(convexUrl);
  await client.mutation(anyApi.analytics.record, {
    sessionHash: digest(body.sessionId), visitorHash: digest(body.visitorId),
    actorHash: clerkUserId ? digest(clerkUserId) : undefined, actorType: clerkUserId ? "signed_in" : "anonymous",
    eventType: body.eventType, path: safePath(body.path) ?? "/", fromPath: safePath(body.fromPath), toPath: safePath(body.toPath),
    ...safeReferrer(body.referrer), targetLabel: body.targetLabel?.trim().slice(0, 120), targetType: body.targetType?.trim().slice(0, 60),
    durationMs: body.durationMs, scrollDepth: body.scrollDepth, ...location, ...clientType(userAgent),
  });
  return new Response(null, { status: 204 });
}
