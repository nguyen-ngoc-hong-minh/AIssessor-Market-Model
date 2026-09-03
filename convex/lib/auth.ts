import type { GenericDatabaseReader } from "convex/server";

type ClerkIdentity = {
  subject: string;
  email?: string;
  name?: string;
  pictureUrl?: string;
};

type IdentityContext = {
  auth: { getUserIdentity(): Promise<ClerkIdentity | null> };
};

type DatabaseAuthContext = IdentityContext & {
  // The generated data model is intentionally avoided so this helper remains usable during code generation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: GenericDatabaseReader<any>;
};

export async function requireIdentity(ctx: IdentityContext) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity;
}

export async function requireUser(ctx: DatabaseAuthContext) {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (!user || user.deletedAt) throw new Error("User profile is not synchronized");
  return user;
}

export async function requireAdmin(ctx: DatabaseAuthContext) {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  const email = (user?.email ?? identity.email ?? "").toLowerCase();
  if (!user || user.deletedAt || !email || !isEvidenceAdminEmail(email)) throw new Error("Administrator access required");
  return user;
}

export function isEvidenceAdminEmail(email: string) {
  const configured = (process.env.EVIDENCE_ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return configured.includes(email.trim().toLowerCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function canAccessStrategy(db: GenericDatabaseReader<any>, userId: string, strategy: { userId: unknown; teamId?: unknown }) {
  if (String(strategy.userId) === userId) return true;
  if (!strategy.teamId) return false;
  type IndexRange = { eq(field: string, value: unknown): IndexRange };
  const untypedDb = db as unknown as { query(table: string): { withIndex(index: string, builder: (range: IndexRange) => IndexRange): { unique(): Promise<unknown> } } };
  const member = await untypedDb.query("teamMembers").withIndex("by_team_user", (q) => q.eq("teamId", strategy.teamId).eq("userId", userId)).unique();
  return Boolean(member);
}
