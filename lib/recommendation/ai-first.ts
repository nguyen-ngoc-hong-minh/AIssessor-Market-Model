export const AI_FIRST_CLASSES = ["AI_NATIVE", "AI_CENTRIC", "AI_ASSISTED", "TRADITIONAL"] as const;
export type AiFirstClass = (typeof AI_FIRST_CLASSES)[number];

export const CONTRIBUTION_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type ContributionLevel = (typeof CONTRIBUTION_LEVELS)[number];

export type AiFirstMetadata = {
  aiFirstClass?: AiFirstClass;
  aiRole?: string;
  aiContributionLevel?: ContributionLevel;
  automationLevel?: ContributionLevel;
  requiredManualWork?: string;
};

const KNOWN_TRADITIONAL_PRODUCTS = /\b(adobe premiere(?: pro)?|adobe after effects|adobe photoshop|davinci resolve|capcut|final cut pro|adobe illustrator)\b/i;

export function isKnownTraditionalProduct(name: string) {
  return KNOWN_TRADITIONAL_PRODUCTS.test(name);
}

function traditionalMetadata(name: string): Required<AiFirstMetadata> {
  return {
    aiFirstClass: "TRADITIONAL",
    aiRole: `${name} is primarily conventional manual production software`,
    aiContributionLevel: "LOW",
    automationLevel: "LOW",
    requiredManualWork: "The user performs most of the production workflow manually",
  };
}

export function isAiFirstEligible(metadata: AiFirstMetadata) {
  const classificationEligible = metadata.aiFirstClass === "AI_NATIVE" || metadata.aiFirstClass === "AI_CENTRIC";
  return classificationEligible && (metadata.aiContributionLevel === "HIGH" || metadata.automationLevel === "HIGH");
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export function aiNativeMetadata(name: string, capabilities: readonly string[]): Required<AiFirstMetadata> {
  if (isKnownTraditionalProduct(name)) return traditionalMetadata(name);
  const role = capabilities.length
    ? `Uses generative AI to perform ${capabilities.slice(0, 4).map(humanize).join(", ")}`
    : "Uses generative AI to substantially produce the requested output";
  return {
    aiFirstClass: "AI_NATIVE",
    aiRole: `${name}: ${role}`,
    aiContributionLevel: "HIGH",
    automationLevel: "HIGH",
    requiredManualWork: "Provide inputs and instructions, then review and refine the generated output",
  };
}

export function aiAccessMetadata(productName: string, accessMethod?: string): Required<AiFirstMetadata> {
  if (isKnownTraditionalProduct(productName)) return traditionalMetadata(productName);
  const marketplace = accessMethod === "marketplace" || accessMethod === "cloud";
  return {
    aiFirstClass: marketplace ? "AI_CENTRIC" : "AI_NATIVE",
    aiRole: marketplace
      ? `${productName} provides managed access to an AI model that performs the selected task`
      : `${productName} runs an AI model that substantially produces the requested output`,
    aiContributionLevel: "HIGH",
    automationLevel: "HIGH",
    requiredManualWork: "Provide inputs and instructions, then review and refine the AI output",
  };
}
