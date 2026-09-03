import { describe, expect, it } from "vitest";
import { getBriefSuggestions } from "@/lib/planner/brief-suggestions";

describe("project brief suggestions", () => {
  it("waits until the user has written enough context", () => {
    expect(getBriefSuggestions("an app")).toEqual([]);
  });

  it("offers domain-specific missing details while the user types", () => {
    const labels = getBriefSuggestions("Build a dating app for university students").map((item) => item.label);
    expect(labels).toContain("Name platforms");
    expect(labels).toContain("List core features");
  });

  it("does not suggest a detail already provided", () => {
    const suggestions = getBriefSuggestions("Create a campaign for students. Success KPI is conversion and the priority channel is Instagram.");
    expect(suggestions.map((item) => item.id)).not.toContain("marketing-kpi");
    expect(suggestions.map((item) => item.id)).not.toContain("marketing-channel");
  });
});
