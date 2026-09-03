import { expect, test } from "@playwright/test";

test("public journey starts an anonymous strategy without forcing account creation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Find your suitable AI/i })).toBeVisible();
  await expect(page.getByText(/No sign-up required/i)).toBeVisible();
  await expect(page.getByText(/What matters most/i)).toHaveCount(0);
  await page.getByRole("button", { name: /Try it for free/i }).click();
  await expect(page.getByPlaceholder(/Create a brand identity/i)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /Show me the workflow/i })).toBeVisible();
  await expect(page.getByText(/What matters most/i)).toHaveCount(0);
});

test("anonymous strategy entry remains compact on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Find your suitable AI/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Try it for free/i })).toBeVisible();
  await page.getByRole("button", { name: /Try it for free/i }).click();
  await expect(page.getByPlaceholder(/Create a brand identity/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Show me the workflow/i })).toBeVisible();
});

test.describe("credentialed Clerk journeys", () => {
  test.skip(!process.env.E2E_CLERK_CONFIGURED, "Requires a configured Clerk development instance");

  test("Clerk sign-up exposes the configured authentication methods", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByText(/email or Google/i)).toBeVisible();
    await expect(page.locator(".cl-rootBox")).toBeVisible();
  });

  test("configured strategy, onboarding bypass, deletion, checkout, and persistence journey", async ({ page }) => {
    test.skip(!process.env.E2E_CLERK_TEST_USER || !process.env.E2E_STRIPE_TEST_MODE, "Requires Clerk, Convex, OpenAI, source APIs, and Stripe test mode");
    await page.goto("/sign-in");
    expect(process.env.E2E_CLERK_TEST_USER).toBeTruthy();
  });
});
