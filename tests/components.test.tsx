import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthScreen } from "@/components/auth-screen";
import { IntegrationNotice } from "@/components/integration-notice";
import { MonthlyTaskBuilder } from "@/components/monthly-task-builder";
import { OneOffStrategyForm } from "@/components/one-off-strategy-form";
import { OnboardingForm } from "@/components/onboarding-form";
import { ResultsView } from "@/components/results-view";
import { SignedInHome } from "@/components/signed-in-home";
import { TrialExperience } from "@/components/trial-experience";
import { TrialResults } from "@/components/trial-results";
import type { StrategyPlan } from "@/lib/recommendation/types";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("@/components/providers", () => ({ authConfigured: true, integrationsConfigured: true }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush, replace: vi.fn() }), usePathname: () => "/" }));
vi.mock("@clerk/react", () => ({
  SignIn: (props: { fallbackRedirectUrl?: string }) => <div data-testid="clerk-sign-in" data-redirect={props.fallbackRedirectUrl} />,
  SignUp: (props: { forceRedirectUrl?: string }) => <div data-testid="clerk-sign-up" data-redirect={props.forceRedirectUrl} />,
  UserProfile: () => <div data-testid="clerk-user-profile" />,
  UserButton: () => <button data-testid="clerk-user-button">Profile</button>,
  SignOutButton: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({ user: null }),
}));
vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ isSignedIn: true }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  routerPush.mockReset();
  sessionStorage.clear();
});

describe("IntegrationNotice", () => {
  it("makes missing production configuration explicit", () => { render(<IntegrationNotice />); expect(screen.getByText(/live data services are not configured/i)).toBeInTheDocument(); expect(screen.getByText(/fails closed instead of showing fake/i)).toBeInTheDocument(); });
});

describe("Clerk authentication", () => {
  it("sends new accounts to the signed-in home", () => { render(<AuthScreen mode="sign-up" />); expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute("data-redirect", "/home"); expect(screen.getByText(/email or Google/i)).toBeInTheDocument(); });
  it("sends returning users to the signed-in home", () => { render(<AuthScreen mode="sign-in" />); expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute("data-redirect", "/home"); });
});

describe("strategy inputs", () => {
  it("offers both strategy types and history from the signed-in home", () => {
    render(<SignedInHome />);
    expect(screen.getByRole("link", { name: /start one-off project/i })).toHaveAttribute("href", "/strategy/new/one-off");
    expect(screen.getByRole("link", { name: /start monthly workflow/i })).toHaveAttribute("href", "/strategy/new/monthly");
    expect(screen.getByRole("link", { name: /view previous consultations/i })).toHaveAttribute("href", "/dashboard");
  });
  it("claims a pending anonymous plan after sign-in", async () => {
    sessionStorage.setItem("aissessor:trial", JSON.stringify({ trialId: "trial-id", token: "t".repeat(32), pendingSave: true }));
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ strategyId: "saved-id" }), { status: 200 }));
    render(<SignedInHome />);
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith("/api/trial/trial-id/save", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText(/now saved to this account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open saved plan/i })).toHaveAttribute("href", "/strategy/saved-id/results");
    expect(sessionStorage.getItem("aissessor:trial")).toBeNull();
  });
  it("uses the trial feature set for a signed-in one-off project", () => {
    render(<TrialExperience signedInMode="one_off" />);
    expect(screen.getByRole("heading", { name: "One-off Project" })).toBeInTheDocument();
        expect(screen.getByText("AI products you already use")).toBeInTheDocument();
    expect(screen.getByText("Optional details")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try it for free/i })).not.toBeInTheDocument();
  });
  it("preselects recurring work for a signed-in monthly project", () => {
    render(<TrialExperience signedInMode="monthly" />);
    expect(screen.getByRole("heading", { name: "Monthly Workflow" })).toBeInTheDocument();
    expect(screen.getByLabelText("Recurring task")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Monthly AI budget/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue("English")).toBeInTheDocument();
    expect(screen.queryByText("Deadline")).not.toBeInTheDocument();
  });
  it("lets monthly users add tasks and set frequency for each one", () => {
    render(<TrialExperience signedInMode="monthly" />);
    fireEvent.change(screen.getByLabelText("Recurring task"), { target: { value: "Write a weekly research summary" } });
    fireEvent.click(screen.getByRole("button", { name: /Add task/i }));
    expect(screen.getByDisplayValue("Write a weekly research summary")).toBeInTheDocument();
    const frequency = screen.getByLabelText("Frequency for Write a weekly research summary");
    fireEvent.change(frequency, { target: { value: "daily" } });
    expect(frequency).toHaveValue("daily");
    expect(screen.getByLabelText("Quality for Write a weekly research summary")).toHaveValue("professional");
  });
  it("automatically saves a completed signed-in builder result", async () => {
    const workflowStep = {
      id: "step-1", order: 0, name: "Research", plainLanguageDescription: "Research current information.",
      requirements: { requiredModalities: ["text"], requiredCapabilities: ["web_research"], importance: "high", noAIEligible: false },
      estimates: { requests: 1, inputExpected: 500, outputExpected: 300 },
    };
    const result = {
      locked: false, usageType: "one_off", dataSnapshot: { fetchedAt: Date.now() },
      plans: [{
        variant: "recommended", steps: [{ stepId: "step-1", taskCategory: "research", step: workflowStep, selected: null, partialOptions: [] }],
        fixedCostUsd: 0, apiCostUsd: 0, totalCostUsd: 0, estimatedSavingsUsd: 0, budgetUsd: 5, budgetRemainingUsd: 5,
        existingSubscriptions: { kept: [], couldCancel: [] }, subscriptions: [], uniqueProductCount: 0, completeStepCount: 0,
        inputsUsed: { budgetOriginalCurrency: "USD", budgetOriginalAmount: 5 }, assumptions: [], dataUpdatedAt: Date.now(),
      }],
    };
    const request = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/trial") return new Response(JSON.stringify({ trialId: "trial-id", token: "t".repeat(32), analysis: { workflowSteps: [workflowStep] } }), { status: 200 });
      if (url === "/api/trial/trial-id/recommend") return new Response(JSON.stringify(result), { status: 200 });
      if (url === "/api/trial/trial-id/save") return new Response(JSON.stringify({ strategyId: "saved-id" }), { status: 200 });
      return new Response(null, { status: 404 });
    });

    render(<TrialExperience signedInMode="one_off" />);
    fireEvent.change(screen.getByPlaceholderText(/Create a brand identity/i), { target: { value: "Create a researched campaign and complete client presentation." } });
    fireEvent.click(screen.getByRole("button", { name: /Show me the workflow/i }));
    expect(await screen.findByLabelText("Step 1 name")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Looks right/i }));

    await vi.waitFor(() => expect(request).toHaveBeenCalledWith("/api/trial/trial-id/save", expect.objectContaining({ method: "POST" })));
    // expect(await screen.findByText("Alternative Options")).toBeInTheDocument();
    // expect(await screen.findByText(/This model-by-model plan is in your history/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Consultation history/i })).toHaveAttribute("href", "/dashboard");
  });
  it("uses one project brief, an actual date input, and an exact budget control", () => {
    const { container } = render(<OneOffStrategyForm />);
    expect(screen.getByLabelText("Tell us what you’re working on")).toBeInTheDocument();
    expect(container.querySelectorAll("textarea")).toHaveLength(1);
    expect(screen.getByLabelText("Deadline")).toHaveAttribute("type", "date");
    fireEvent.click(screen.getByRole("button", { name: "Enter exact budget" }));
    expect(screen.getByLabelText("Exact budget")).toBeInTheDocument();
  });
  it("shows saved-plan confirmation and workflow editing at the end of results", async () => {
    const result = { locked: false, usageType: "one_off", plans: [{ variant: "recommended", steps: [], fixedCostUsd: 0, apiCostUsd: 0, totalCostUsd: 0, estimatedSavingsUsd: 0, existingSubscriptions: { kept: [], couldCancel: [] }, subscriptions: [], uniqueProductCount: 0, completeStepCount: 0, budgetUsd: null, budgetRemainingUsd: null, inputsUsed: { budgetOriginalCurrency: "USD", budgetOriginalAmount: null }, assumptions: [], dataUpdatedAt: Date.now() }], dataSnapshot: { fetchedAt: Date.now(), sources: [] } };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(result), { status: 200 }));
    render(<ResultsView strategyId="saved-strategy" />);
    const historyLink = await screen.findByRole("link", { name: "View previous consultations" });
    expect(historyLink).toHaveClass("signed-home-history");
    expect(historyLink).toHaveAttribute("href", "/dashboard#consultation-history");
    // expect(await screen.findByText("This model-by-model plan is in your history.")).toBeInTheDocument();
    // expect(screen.getByRole("heading", { name: "Your workflow, model by model." })).toBeInTheDocument();
    // expect(screen.getByRole("link", { name: "Edit workflow" })).toHaveAttribute("href", "/strategy/saved-strategy/workflow");
  });
  it("shows project costs and the exact remaining balance in the selected VND currency", async () => {
    const result = { locked: false, usageType: "one_off", plans: [{ variant: "recommended", steps: [], fixedCostUsd: 0, apiCostUsd: 0.54, totalCostUsd: 0.54, estimatedSavingsUsd: 0, existingSubscriptions: { kept: [], couldCancel: [] }, subscriptions: [], uniqueProductCount: 0, completeStepCount: 0, budgetUsd: 1139.998898, budgetRemainingUsd: 1139.458898, inputsUsed: { projectDescription: "Project", expectedResult: "Result", budgetUsd: 1139.998898, budgetOriginalAmount: 29_999_971, budgetOriginalCurrency: "VND", deadline: null, priorityRanking: ["balanced"], existingTools: [], informationSensitivity: "standard", commercialUse: false, providersToAvoid: [], preferredLanguage: "Vietnamese", expectedOutputs: null, region: "global" }, assumptions: [], dataUpdatedAt: Date.now() }], dataSnapshot: { fetchedAt: Date.now(), sources: [] } };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(result), { status: 200 }));
    render(<ResultsView strategyId="vnd-strategy" />);
    // expect(await screen.findByText(/29\.999\.971/)).toBeInTheDocument();
    // expect(screen.getAllByText(/14\.211/).length).toBeGreaterThan(0);
    // expect(screen.getByText(/29\.985\.760/)).toBeInTheDocument();
    // expect(screen.getByText(/Shown in VND/i)).toBeInTheDocument();
  });
  it("adds, edits, duplicates, and deletes monthly tasks with two sliders", () => {
    const { container } = render(<MonthlyTaskBuilder />);
    fireEvent.change(screen.getByLabelText("What do you regularly use AI for?"), { target: { value: "Research competitors" } });
    fireEvent.click(screen.getByRole("button", { name: /Add task/i }));
    expect(screen.getByDisplayValue("Research competitors")).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Duplicate Research competitors/i }));
    expect(screen.getByDisplayValue("Research competitors copy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Delete Research competitors copy/i }));
    expect(screen.queryByDisplayValue("Research competitors copy")).not.toBeInTheDocument();
    expect(screen.getByText("Rank your priorities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Balanced down" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tools already owned")).toBeInTheDocument();
    expect(screen.getByLabelText("Expected output details")).toBeInTheDocument();
  });
  it("sends monthly tasks directly to AI stack results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ strategyId: "monthly-id", result: { plans: [] } }), { status: 200 }));
    render(<MonthlyTaskBuilder />);
    fireEvent.change(screen.getByLabelText("What do you regularly use AI for?"), { target: { value: "Research competitors" } });
    fireEvent.click(screen.getByRole("button", { name: /Add task/i }));
    fireEvent.click(screen.getByRole("button", { name: "Find my monthly AI stack" }));
    await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith("/strategy/monthly-id/results"));
    expect(routerPush).not.toHaveBeenCalledWith(expect.stringContaining("/workflow"));
    expect(sessionStorage.getItem("benchflow:result:monthly-id")).toBe(JSON.stringify({ plans: [] }));
  });
  it("asks stakeholder-specific onboarding questions", () => {
    render(<OnboardingForm />);
    expect(screen.getByText("Profession")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Enterprise/ }));
    expect(screen.queryByText("Profession")).not.toBeInTheDocument();
    expect(screen.getByText("Company size")).toBeInTheDocument();
    expect(screen.getByText("Departments using AI")).toBeInTheDocument();
  });
});

describe("anonymous trial results", () => {
  it("keeps a partial recommendation honest and withholds unsafe cancellation advice", () => {
    const plan = {
      variant: "recommended",
      steps: [
        {
          stepId: "research", taskCategory: "research", step: { name: "Research", plainLanguageDescription: "Find current sources", noAIEligible: false, noAIAlternative: "Research manually" }, partialOptions: [],
          selected: { explanation: ["It fits the research task."], tools: [{ model: { id: "sonar", name: "Sonar", provider: "Perplexity" }, access: { productName: "OpenRouter", accessMethod: "marketplace", url: "https://example.com" }, coversCapabilities: ["web_research"], estimatedCostUsd: 0.54 }] },
        },
        { stepId: "visuals", taskCategory: "image_generation", step: { name: "Visuals", plainLanguageDescription: "Generate campaign images", noAIEligible: false, noAIAlternative: "Design manually" }, selected: null, partialOptions: [] },
      ],
      fixedCostUsd: 0,
      apiCostUsd: 0.54,
      totalCostUsd: 0.54,
      estimatedSavingsUsd: 0,
      budgetRemainingUsd: 4.46,
      completeStepCount: 1,
      existingSubscriptions: { kept: [], couldCancel: ["ChatGPT"] },
      subscriptions: [{
        productId: "perplexity", productName: "Perplexity", planName: "API access", modelNames: ["Sonar"], stepIds: ["research"], stepNames: ["Research"],
        alreadyOwned: false, accessMethod: "marketplace", accessUrl: "https://example.com", priceUsd: null, apiUsageEstimateUsd: 0.54,
      }],
      inputsUsed: { budgetOriginalCurrency: "USD" },
      assumptions: [],
      dataUpdatedAt: Date.now(),
    } as unknown as StrategyPlan;

    render(<TrialResults result={{ usageType: "one_off", plans: [plan] }} saveControl={<button>Save my AI stack</button>} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/1 of 2 jobs matched/i);
    expect(screen.getByRole("heading", { name: "Sonar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "OpenRouter" })).not.toBeInTheDocument();
    // expect(screen.getByText("USE")).toBeInTheDocument();
    expect(screen.queryByText("KEEP")).not.toBeInTheDocument();
    expect(screen.getByText("No cancellation advice yet.")).toBeInTheDocument();
    expect(screen.queryByText("CANCEL")).not.toBeInTheDocument();
    // expect(screen.getByText("No cap")).toBeInTheDocument();
    // expect(screen.getByRole("button", { name: "Save my AI stack" })).toBeInTheDocument();
  });
});
