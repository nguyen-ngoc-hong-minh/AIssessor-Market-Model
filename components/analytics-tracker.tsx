"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type AnalyticsEvent = {
  eventType: "page_view" | "engagement" | "click" | "form_submit";
  path: string; fromPath?: string; toPath?: string; referrer?: string; targetLabel?: string; targetType?: string;
  durationMs?: number; scrollDepth?: number;
};

const VISITOR_KEY = "aissessor_visitor_id";
const SESSION_KEY = "aissessor_session_id";
const PREVIOUS_PATH_KEY = "aissessor_previous_path";
const memoryIdentifiers = new Map<string, string>();

function identifier(storage: Storage, key: string) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const value = crypto.randomUUID();
    storage.setItem(key, value);
    return value;
  } catch {
    const existing = memoryIdentifiers.get(key);
    if (existing) return existing;
    const value = crypto.randomUUID(); memoryIdentifiers.set(key, value); return value;
  }
}

function send(event: AnalyticsEvent, beacon = false) {
  const payload = JSON.stringify({
    ...event,
    visitorId: identifier(localStorage, VISITOR_KEY),
    sessionId: identifier(sessionStorage, SESSION_KEY),
  });
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/events", new Blob([payload], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics/events", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => undefined);
}

function labelFor(element: HTMLElement) {
  return element.dataset.analyticsLabel || element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) || element.tagName.toLowerCase();
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const activePath = useRef(pathname);
  const activeSince = useRef(0);
  const maxScroll = useRef(0);

  useEffect(() => {
    const privacyControl = navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    if (privacyControl) return;
    const previous = sessionStorage.getItem(PREVIOUS_PATH_KEY) ?? undefined;
    activePath.current = pathname;
    activeSince.current = Date.now();
    maxScroll.current = 0;
    send({ eventType: "page_view", path: pathname, fromPath: previous, referrer: previous ? undefined : document.referrer || undefined });
    sessionStorage.setItem(PREVIOUS_PATH_KEY, pathname);

    const flushEngagement = (beacon = false) => {
      if (!activeSince.current) return;
      const durationMs = Math.min(60_000, Math.max(0, Date.now() - activeSince.current));
      if (durationMs >= 1_000) send({ eventType: "engagement", path: activePath.current, durationMs, scrollDepth: maxScroll.current }, beacon);
      activeSince.current = Date.now();
    };
    // One minute keeps active-time estimates useful without producing high write volume on the free backend tier.
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") flushEngagement(); }, 60_000);
    const visibility = () => {
      if (document.visibilityState === "hidden") flushEngagement(true);
      else activeSince.current = Date.now();
    };
    const scroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      maxScroll.current = Math.max(maxScroll.current, height > 0 ? Math.round((window.scrollY / height) * 100) : 100);
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("scroll", scroll);
      flushEngagement(true);
    };
  }, [pathname]);

  useEffect(() => {
    const privacyControl = navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    if (privacyControl) return;
    const click = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest<HTMLElement>("button, a, [role='button'], [data-analytics-label]");
      if (!element) return;
      const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") ?? undefined : undefined;
      send({ eventType: "click", path: window.location.pathname, toPath: href?.startsWith("/") ? href : undefined, targetLabel: labelFor(element), targetType: element.tagName.toLowerCase() });
    };
    const submit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      send({ eventType: "form_submit", path: window.location.pathname, targetLabel: form.dataset.analyticsLabel || form.getAttribute("aria-label") || form.id || "Form", targetType: "form" });
    };
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => { document.removeEventListener("click", click, true); document.removeEventListener("submit", submit, true); };
  }, []);

  return null;
}
