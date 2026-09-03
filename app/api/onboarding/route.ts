import { anyApi } from "convex/server";
import { OnboardingSchema } from "@/lib/onboarding";
import { apiError, authenticatedConvex } from "@/lib/server/convex";

async function save(request: Request, update: boolean) {
  try {
    const input = OnboardingSchema.parse(await request.json());
    const client = await authenticatedConvex();
    const fields = {
      accountType: input.accountType, profession: "profession" in input ? input.profession : undefined,
      industry: input.industry, teamSize: "teamSize" in input ? input.teamSize : undefined,
      companySize: "companySize" in input ? input.companySize : undefined,
      departments: "departments" in input ? input.departments : undefined,
      country: input.country, preferredLanguage: input.preferredLanguage,
    };
    await client.mutation(update ? anyApi.profiles.updateCurrent : anyApi.profiles.completeOnboarding, fields);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) { return save(request, false); }
export async function PUT(request: Request) { return save(request, true); }
