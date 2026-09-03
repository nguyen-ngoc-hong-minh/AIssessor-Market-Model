import { z } from "zod";

const shared = {
  industry: z.string().min(1, "Choose an industry"),
  country: z.string().min(1, "Choose a country"),
  preferredLanguage: z.string().min(1, "Choose a preferred language"),
};

export const OnboardingSchema = z.discriminatedUnion("accountType", [
  z.object({ accountType: z.literal("individual"), ...shared, profession: z.string().min(1, "Choose a profession") }),
  z.object({ accountType: z.literal("team"), ...shared, profession: z.string().min(1, "Choose your role"), teamSize: z.string().min(1, "Choose a team size") }),
  z.object({ accountType: z.literal("enterprise"), ...shared, companySize: z.string().min(1, "Choose a company size"), departments: z.array(z.string()).min(1, "Choose at least one department") }),
]);

export type OnboardingInput = z.infer<typeof OnboardingSchema>;
