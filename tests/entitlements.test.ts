import { describe,expect,it } from "vitest";
import { subscriptionEntitlements } from "@/lib/billing/entitlements";
describe("subscription entitlements",()=>{it("fails closed for inactive subscriptions",()=>expect(subscriptionEntitlements({plan:"plus",status:"past_due"}).canViewFullResults).toBe(false));it("unlocks full results for active Plus",()=>expect(subscriptionEntitlements({plan:"plus",status:"active"}).canSave).toBe(true));it("reserves team features for Team",()=>expect(subscriptionEntitlements({plan:"plus",status:"active"}).canUseTeam).toBe(false))});
