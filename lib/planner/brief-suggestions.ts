export type BriefSuggestion = {
  id: string;
  label: string;
  text: string;
};

type SuggestionRule = BriefSuggestion & { present: RegExp };

const sharedRules: SuggestionRule[] = [
  { id: "audience", label: "Define the audience", text: "The target audience is [who will use or see this].", present: /audience|customer|user|viewer|reader|student|employee|client/i },
  { id: "deliverable", label: "Specify deliverables", text: "The final deliverables should include [files, formats, dimensions, or quantity].", present: /deliverable|format|file|dimension|resolution|pages?|minutes?|screens?|assets?/i },
  { id: "success", label: "Add success criteria", text: "Success means [measurable result, quality bar, or KPI].", present: /success|goal|kpi|metric|conversion|accuracy|quality bar|outcome/i },
  { id: "inputs", label: "Mention available inputs", text: "Available inputs and source material include [documents, data, brand assets, or links].", present: /input|source|document|dataset|brand asset|reference|material|link/i },
  { id: "constraints", label: "Add constraints", text: "Important constraints are [privacy, brand, legal, platform, or approval requirements].", present: /constraint|privacy|confidential|brand|legal|compliance|approval|must not|restriction/i },
];

const domainRules: Array<{ match: RegExp; rules: SuggestionRule[] }> = [
  {
    match: /\b(app|website|platform|software|saas|dashboard)\b/i,
    rules: [
      { id: "app-platform", label: "Name platforms", text: "It should support [web, iOS, Android, desktop] and work well on [priority devices].", present: /ios|android|web|desktop|mobile|device|platform/i },
      { id: "app-features", label: "List core features", text: "The must-have features are [feature 1], [feature 2], and [feature 3].", present: /feature|function|user can|must-have|workflow/i },
    ],
  },
  {
    match: /\b(video|animation|film|reel|youtube|storyboard)\b/i,
    rules: [
      { id: "video-spec", label: "Add video specs", text: "The video should be [duration], [aspect ratio], and delivered at [resolution].", present: /duration|seconds?|minutes?|aspect ratio|16:9|9:16|resolution|1080|4k/i },
      { id: "video-style", label: "Describe the visual style", text: "The visual style should feel [tone/style], with references such as [examples].", present: /style|tone|look|visual direction|reference|cinematic|animated/i },
    ],
  },
  {
    match: /\b(marketing|campaign|social|advertising|launch|brand)\b/i,
    rules: [
      { id: "marketing-channel", label: "Choose channels", text: "The priority channels are [social, email, search, web, or offline].", present: /channel|instagram|tiktok|linkedin|email|search|social|offline/i },
      { id: "marketing-kpi", label: "Add campaign KPIs", text: "Measure success using [reach, leads, conversions, revenue, or engagement].", present: /reach|lead|conversion|revenue|engagement|kpi|metric/i },
    ],
  },
  {
    match: /\b(research|report|analysis|study|academic)\b/i,
    rules: [
      { id: "research-sources", label: "Set source standards", text: "Use [preferred source types] and include citations in [citation format].", present: /citation|source type|peer.review|apa|mla|harvard|bibliography/i },
      { id: "research-scope", label: "Define research scope", text: "Cover [topics, geography, and time period], excluding [out-of-scope areas].", present: /scope|geograph|time period|date range|exclude|out.of.scope/i },
    ],
  },
];

export function getBriefSuggestions(brief: string, limit = 4): BriefSuggestion[] {
  const normalized = brief.trim();
  if (normalized.length < 10) return [];
  const domain = domainRules.find((group) => group.match.test(normalized));
  return [...(domain?.rules ?? []), ...sharedRules]
    .filter((rule) => !rule.present.test(normalized))
    .slice(0, limit)
    .map(({ id, label, text }) => ({ id, label, text }));
}
