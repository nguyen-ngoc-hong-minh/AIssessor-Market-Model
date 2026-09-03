import { verifyWebhook } from "@clerk/backend/webhooks";
import Stripe from "stripe";
import { anyApi, httpActionGeneric as httpAction, httpRouter } from "convex/server";

const http = httpRouter();

http.route({ path: "/clerk-webhook", method: "POST", handler: httpAction(async (ctx, request) => {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  const syncKey = process.env.CLERK_WEBHOOK_SYNC_KEY;
  if (!signingSecret || !syncKey) return new Response("Clerk synchronization is not configured", { status: 503 });

  let event;
  try { event = await verifyWebhook(request, { signingSecret }); }
  catch { return new Response("Invalid webhook signature", { status: 400 }); }

  if (!["user.created", "user.updated", "user.deleted"].includes(event.type)) return new Response("Ignored", { status: 200 });
  const eventId = request.headers.get("svix-id");
  if (!eventId) return new Response("Missing webhook event id", { status: 400 });
  const data = event.data;
  if (!data.id) return new Response("Missing Clerk user id", { status: 400 });
  const email = "email_addresses" in data
    ? data.email_addresses.find((item) => item.id === data.primary_email_address_id)?.email_address ?? data.email_addresses[0]?.email_address
    : undefined;
  const displayName = "first_name" in data ? [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || undefined : undefined;
  const avatarUrl = "image_url" in data ? data.image_url : undefined;
  await ctx.runMutation(anyApi.users.syncFromClerkWebhook, {
    syncKey, eventId, eventType: event.type, clerkUserId: data.id, email, displayName, avatarUrl,
  });
  return new Response("Webhook processed", { status: 200 });
}) });

http.route({ path: "/stripe-webhook", method: "POST", handler: httpAction(async (ctx, request) => {
  const secretKey = process.env.STRIPE_SECRET_KEY; const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return new Response("Webhook not configured", { status: 503 });
  const signature = request.headers.get("stripe-signature"); if (!signature) return new Response("Missing signature", { status: 400 });
  const body = await request.text(); let event: Stripe.Event;
  try { event = await new Stripe(secretKey).webhooks.constructEventAsync(body, signature, webhookSecret); }
  catch { return new Response("Invalid signature", { status: 400 }); }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = event.data.object as Stripe.Subscription;
    const clerkUserId = subscription.metadata.clerkUserId; const plan = subscription.metadata.plan;
    if (clerkUserId && ["plus", "team"].includes(plan)) {
      const item = subscription.items.data[0];
      const periodEnd = item?.current_period_end ? item.current_period_end * 1000 : undefined;
      await ctx.runMutation(anyApi.subscriptions.upsertVerified, {
        clerkUserId, stripeCustomerId: String(subscription.customer), stripeSubscriptionId: subscription.id,
        stripePriceId: item?.price.id, plan, status: subscription.status, currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    }
  }
  return new Response("ok");
}) });

export default http;
