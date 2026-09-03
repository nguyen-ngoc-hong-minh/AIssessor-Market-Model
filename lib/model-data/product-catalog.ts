import type { Capability, TaskCategory } from "../recommendation/taxonomy";

export type OfficialProductDefinition = {
  id: string;
  name: string;
  provider: string;
  sourceUrl: string;
  verificationUrl?: string;
  accessUrl: string;
  verificationTerms: string[];
  modalities: string[];
  capabilities: Capability[];
  categories: TaskCategory[];
  planId: string;
  planName: string;
  monthlyPriceUsd?: number;
  priceNote?: string;
  aiFirstClass: "AI_NATIVE" | "AI_CENTRIC";
  aiRole: string;
  requiredManualWork: string;
};

export const OFFICIAL_AI_PRODUCTS: readonly OfficialProductDefinition[] = [
  {
    id: "openai/codex-product", name: "OpenAI Codex", provider: "OpenAI",
    sourceUrl: "https://developers.openai.com/", accessUrl: "https://chatgpt.com/codex",
    verificationTerms: ["codex", "codebases", "build and test"], modalities: ["text"],
    capabilities: ["coding", "repository_editing", "test_generation", "agentic_execution", "tool_use"],
    categories: ["coding", "software_engineering", "agentic_workflow"],
    planId: "codex-access", planName: "ChatGPT plan or API usage", aiFirstClass: "AI_NATIVE",
    aiRole: "An AI coding agent that works across a codebase to implement, test, fix, and review changes",
    requiredManualWork: "Review the proposed changes and approve delivery",
  },
  {
    id: "cursor/cursor-agent", name: "Cursor", provider: "Cursor",
    sourceUrl: "https://cursor.com/docs", accessUrl: "https://cursor.com/pricing",
    verificationTerms: ["cursor", "agent", "codebase"], modalities: ["text"],
    capabilities: ["coding", "repository_editing", "test_generation", "agentic_execution", "tool_use"],
    categories: ["coding", "software_engineering", "agentic_workflow"],
    planId: "cursor-pro", planName: "Pro", monthlyPriceUsd: 20, aiFirstClass: "AI_NATIVE",
    aiRole: "An AI coding agent that understands a repository and implements, fixes, reviews, and tests code",
    requiredManualWork: "Review and merge the generated code changes",
  },
  {
    id: "anthropic/claude-code-product", name: "Claude Code", provider: "Anthropic",
    sourceUrl: "https://docs.anthropic.com/en/docs/claude-code/getting-started", accessUrl: "https://claude.ai/",
    verificationTerms: ["claude code", "project", "code"], modalities: ["text"],
    capabilities: ["coding", "repository_editing", "test_generation", "agentic_execution", "tool_use"],
    categories: ["coding", "software_engineering", "agentic_workflow"],
    planId: "claude-code-access", planName: "Claude plan or API usage", aiFirstClass: "AI_NATIVE",
    aiRole: "An agentic coding product that reads projects, edits repositories, runs tools, and verifies changes",
    requiredManualWork: "Review the generated changes and requested permissions",
  },
  {
    id: "github/copilot-product", name: "GitHub Copilot", provider: "GitHub",
    sourceUrl: "https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent", accessUrl: "https://github.com/features/copilot/plans",
    verificationTerms: ["copilot", "repository", "code changes"], modalities: ["text"],
    capabilities: ["coding", "repository_editing", "test_generation", "agentic_execution", "tool_use"],
    categories: ["coding", "software_engineering", "agentic_workflow"],
    planId: "github-copilot-paid", planName: "Paid Copilot plan", priceNote: "Plan price and AI-credit usage vary", aiFirstClass: "AI_NATIVE",
    aiRole: "An AI coding agent that can plan repository work, make code changes, and open pull requests",
    requiredManualWork: "Review the pull request and validate the generated changes",
  },
  {
    id: "replit/replit-agent", name: "Replit Agent", provider: "Replit",
    sourceUrl: "https://docs.replit.com/build/your-first-app", accessUrl: "https://replit.com/pricing",
    verificationTerms: ["agent", "build", "publish"], modalities: ["text"],
    capabilities: ["coding", "repository_editing", "test_generation", "deployment", "ui_generation", "agentic_execution"],
    categories: ["coding", "software_engineering", "ui_ux_design", "agentic_workflow"],
    planId: "replit-agent-access", planName: "Replit plan with Agent", aiFirstClass: "AI_CENTRIC",
    aiRole: "An AI app builder that plans, writes, fixes, previews, and publishes applications",
    requiredManualWork: "Review the generated app and test the published result",
  },
  {
    id: "lovable/lovable-product", name: "Lovable", provider: "Lovable",
    sourceUrl: "https://lovable.dev/pricing", accessUrl: "https://lovable.dev/pricing",
    verificationTerms: ["lovable", "ai", "apps"], modalities: ["text"],
    capabilities: ["coding", "repository_editing", "deployment", "ui_generation", "agentic_execution"],
    categories: ["coding", "software_engineering", "ui_ux_design", "agentic_workflow"],
    planId: "lovable-pro", planName: "Pro credit plan", aiFirstClass: "AI_CENTRIC",
    aiRole: "An AI software builder that turns instructions into working web applications",
    requiredManualWork: "Review the application, connect services, and approve deployment",
  },
  {
    id: "vercel/v0-product", name: "v0", provider: "Vercel",
    sourceUrl: "https://v0.dev/docs/faqs", accessUrl: "https://v0.dev/pricing",
    verificationTerms: ["v0", "code", "github"], modalities: ["text"],
    capabilities: ["coding", "repository_editing", "deployment", "ui_generation", "agentic_execution"],
    categories: ["coding", "software_engineering", "ui_ux_design", "agentic_workflow"],
    planId: "v0-plus", planName: "Plus", monthlyPriceUsd: 30, aiFirstClass: "AI_CENTRIC",
    aiRole: "An AI app and interface builder that generates code, syncs with GitHub, and deploys projects",
    requiredManualWork: "Review generated code and confirm integrations and deployment",
  },
  {
    id: "perplexity/perplexity-pro", name: "Perplexity", provider: "Perplexity",
    sourceUrl: "https://www.perplexity.ai/help-center/en/articles/10352901-what-is-perplexity-pro", accessUrl: "https://www.perplexity.ai/pro",
    verificationTerms: ["perplexity pro", "sources", "research"], modalities: ["text"],
    capabilities: ["web_research", "citation_support", "reasoning", "document_parsing", "text_generation"],
    categories: ["research", "business_writing", "long_document_analysis"],
    planId: "perplexity-pro", planName: "Pro (annual equivalent)", monthlyPriceUsd: 17, aiFirstClass: "AI_NATIVE",
    aiRole: "An AI research product that searches current sources and produces cited answers and reports",
    requiredManualWork: "Review source quality and verify high-impact claims",
  },
  {
    id: "elicit/elicit-product", name: "Elicit", provider: "Elicit",
    sourceUrl: "https://support.elicit.com/en/articles/14757967-why-elicit-is-different-from-other-research-tools", accessUrl: "https://elicit.com/",
    verificationTerms: ["literature review", "papers", "summary"], modalities: ["text"],
    capabilities: ["web_research", "citation_support", "reasoning", "document_parsing", "long_context", "text_generation"],
    categories: ["research", "long_document_analysis"],
    planId: "elicit-research-access", planName: "Free or paid research plan", aiFirstClass: "AI_NATIVE",
    aiRole: "An AI research assistant that finds relevant papers, summarizes evidence, and structures literature-review outputs with traceable sources",
    requiredManualWork: "Read the original papers, verify extracted findings, and write the final academic argument",
  },
  {
    id: "deepl/deepl-translator", name: "DeepL", provider: "DeepL",
    sourceUrl: "https://www.deepl.com/en/developers", accessUrl: "https://www.deepl.com/translator/files",
    verificationTerms: ["translate", "document api", "glossary"], modalities: ["text"],
    capabilities: ["translation", "document_parsing", "long_context", "text_generation"],
    categories: ["translation", "long_document_analysis"],
    planId: "deepl-translator-access", planName: "DeepL account or API plan", aiFirstClass: "AI_NATIVE",
    aiRole: "An AI translation product that translates long documents while preserving formatting and applying terminology glossaries",
    requiredManualWork: "Review literary tone, named entities, terminology, and final publication quality",
  },
  {
    id: "midjourney/midjourney-product", name: "Midjourney", provider: "Midjourney",
    sourceUrl: "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans", accessUrl: "https://www.midjourney.com/account",
    verificationUrl: "https://docs.midjourney.com/api/v2/help_center/en-us/articles/27870484040333.json",
    verificationTerms: ["midjourney", "basic plan", "images"], modalities: ["image"],
    capabilities: ["image_generation"], categories: ["image_generation"],
    planId: "midjourney-basic", planName: "Basic", monthlyPriceUsd: 10, aiFirstClass: "AI_NATIVE",
    aiRole: "An AI image-generation product that creates visual assets from prompts and references",
    requiredManualWork: "Choose, refine, and approve generated images",
  },
  {
    id: "runway/runway-product", name: "Runway", provider: "Runway",
    sourceUrl: "https://help.runwayml.com/hc/en-us/articles/49191105352339-Standard-plan-details", accessUrl: "https://runwayml.com/pricing",
    verificationUrl: "https://help.runwayml.com/api/v2/help_center/en-us/articles/49191105352339.json",
    verificationTerms: ["runway", "standard", "video"], modalities: ["image", "video"],
    capabilities: ["image_generation", "video_generation", "video_editing"], categories: ["image_generation", "video_generation", "video_editing"],
    planId: "runway-standard", planName: "Standard", aiFirstClass: "AI_CENTRIC",
    aiRole: "An AI video platform that generates and transforms footage and visual assets",
    requiredManualWork: "Select generations and approve the assembled output",
  },
  {
    id: "gamma/gamma-product", name: "Gamma", provider: "Gamma",
    sourceUrl: "https://help.gamma.app/en/articles/7838093-how-do-i-create-a-new-presentation-document-or-webpage-in-gamma", accessUrl: "https://gamma.app/pricing",
    verificationTerms: ["gamma", "presentations", "ai-powered"], modalities: ["text", "image"],
    capabilities: ["presentation_generation", "image_generation", "text_generation"], categories: ["presentation", "business_writing", "image_generation"],
    planId: "gamma-plus", planName: "Plus", aiFirstClass: "AI_CENTRIC",
    aiRole: "An AI presentation and document generator that creates structured, designed deliverables",
    requiredManualWork: "Review facts, edit the narrative, and approve the visual output",
  },
  {
    id: "elevenlabs/elevenlabs-product", name: "ElevenLabs", provider: "ElevenLabs",
    sourceUrl: "https://elevenlabs.io/docs/overview/capabilities/dubbing", accessUrl: "https://elevenlabs.io/pricing",
    verificationTerms: ["elevenlabs", "dubbing", "languages"], modalities: ["audio"],
    capabilities: ["text_to_speech", "audio_generation", "translation"], categories: ["audio_generation", "translation"],
    planId: "elevenlabs-paid", planName: "Paid credit plan", aiFirstClass: "AI_NATIVE",
    aiRole: "An AI voice and dubbing product that generates speech and localized audio",
    requiredManualWork: "Review pronunciation, timing, and rights for the selected voice",
  },
  {
    id: "adobe/firefly-standard", name: "Adobe Firefly", provider: "Adobe",
    sourceUrl: "https://www.adobe.com/products/firefly/plans.html", accessUrl: "https://firefly.adobe.com/",
    verificationUrl: "https://news.adobe.com/news/2025/02/firefly-web-app-commercially-safe",
    verificationTerms: ["firefly standard", "$9.99", "2,000", "translate audio and video"], modalities: ["image", "video", "audio"],
    capabilities: ["image_generation", "video_generation", "video_editing", "audio_generation", "translation"],
    categories: ["image_generation", "video_generation", "video_editing", "audio_generation", "translation"],
    planId: "firefly-standard", planName: "Firefly Standard", monthlyPriceUsd: 9.99,
    priceNote: "Includes 2,000 generative credits per month; generation limits vary by feature and model.",
    aiFirstClass: "AI_CENTRIC",
    aiRole: "A creative AI workspace for generating and editing images, video, audio, and localized media",
    requiredManualWork: "Choose the appropriate model, refine creative direction, and review usage rights before publishing",
  },
  {
    id: "synthesia/synthesia-starter", name: "Synthesia", provider: "Synthesia",
    sourceUrl: "https://www.synthesia.io/pricing", accessUrl: "https://app.synthesia.io/",
    verificationTerms: ["starter", "29", "ai avatars", "160+ languages"], modalities: ["text", "video", "audio"],
    capabilities: ["video_generation", "video_editing", "text_to_speech", "translation", "presentation_generation"],
    categories: ["video_generation", "video_editing", "audio_generation", "translation", "presentation", "customer_support"],
    planId: "synthesia-starter", planName: "Starter", monthlyPriceUsd: 29,
    priceNote: "Monthly Starter plan with a limited monthly video-generation allowance.",
    aiFirstClass: "AI_NATIVE",
    aiRole: "An AI video platform for producing narrated avatar videos, training content, explainers, and localized presentations",
    requiredManualWork: "Review the script, pronunciation, avatar presentation, brand fit, and final rendered video",
  },
  {
    id: "suno/suno-pro", name: "Suno", provider: "Suno",
    sourceUrl: "https://suno.com/pricing", accessUrl: "https://suno.com/create",
    verificationTerms: ["pro plan", "song generation", "commercial rights", "2,500 credits"], modalities: ["audio"],
    capabilities: ["audio_generation"], categories: ["audio_generation"],
    planId: "suno-pro", planName: "Pro (annual equivalent)", monthlyPriceUsd: 8,
    priceNote: "Annual-billing equivalent; the monthly plan costs more. Commercial rights apply to eligible songs created while subscribed.",
    aiFirstClass: "AI_NATIVE",
    aiRole: "An AI music studio for generating, extending, remixing, and editing songs with vocals or instrumentals",
    requiredManualWork: "Direct the composition, review lyrics and audio quality, and confirm commercial-use terms for the final track",
  },
  {
    id: "jasper/jasper-pro", name: "Jasper", provider: "Jasper",
    sourceUrl: "https://www.jasper.ai/pricing", accessUrl: "https://app.jasper.ai/",
    verificationTerms: ["pro", "$", "69", "agents for core marketing workflows"], modalities: ["text", "image"],
    capabilities: ["text_generation", "image_generation", "translation", "workflow_automation", "agentic_execution", "tool_use"],
    categories: ["general_writing", "business_writing", "image_generation", "translation", "automation", "agentic_workflow"],
    planId: "jasper-pro", planName: "Pro (monthly)", monthlyPriceUsd: 69,
    priceNote: "Monthly price for one Pro seat; annual billing has a lower monthly equivalent.",
    aiFirstClass: "AI_CENTRIC",
    aiRole: "A marketing AI workspace for on-brand writing, campaign imagery, translation, and agent-led marketing workflows",
    requiredManualWork: "Supply brand context, validate claims, and approve the campaign content and imagery",
  },
] as const;
