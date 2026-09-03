"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  Calculator,
  Check,
  CircleHelp,
  Clipboard,
  Copy,
  Download,
  FileText,
  Gauge,
  Gift,
  Globe2,
  Layers3,
  Lock,
  Menu,
  Moon,
  Pin,
  Plus,
  RotateCcw,
  Rocket,
  Search,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Currency = "USD" | "VND";
type Theme = "light" | "dark";
type Horizon = "1Y" | "3Y" | "5Y";
type CaseId = "ultraConservative" | "base" | "aggressive";
type SlideId = "cover" | "tamsam" | "monetization" | "finance" | "competition" | "strategy";
type TamTab = "audience" | "pricing" | "costs" | "targets";
type FinancialTab = "growth" | "competitors" | "regions" | "economics";

const FX_VND = 25_000;

const cases: Record<CaseId, { label: string; year1: number; year3: number; year5: number; arpu: number; churn: number; margin: number; cac: number; color: string }> = {
  ultraConservative: { label: "Ultra-conservative", year1: 0.05, year3: 0.2, year5: 0.5, arpu: 60, churn: 6, margin: 80, cac: 24, color: "#4F46E5" },
  base: { label: "Base Case", year1: 0.1, year3: 0.5, year5: 1, arpu: 84, churn: 4.5, margin: 85, cac: 18, color: "#0213B0" },
  aggressive: { label: "Aggressive", year1: 0.15, year3: 0.75, year5: 1.5, arpu: 108, churn: 3.5, margin: 88, cac: 15, color: "#00A88F" },
};

const slides: { id: SlideId; label: string }[] = [
  { id: "cover", label: "Executive Cover" },
  { id: "tamsam", label: "TAM / SAM / SOM" },
  { id: "monetization", label: "Freemium & Revenue" },
  { id: "finance", label: "Financial Engine" },
  { id: "competition", label: "Market Comparison" },
  { id: "strategy", label: "AI & HCMC Strategy" },
];

const tamTabs: { id: TamTab; label: string; icon: typeof Users }[] = [
  { id: "audience", label: "Market Size & Audience", icon: Users },
  { id: "pricing", label: "Pricing & Monetization", icon: WalletCards },
  { id: "costs", label: "LLM Costs & CAC/LTV", icon: BrainCircuit },
  { id: "targets", label: "SOM Targets & HCMC Hub", icon: Layers3 },
];

function money(value: number, currency: Currency, compact = false) {
  const amount = currency === "VND" ? value * FX_VND : value;
  if (compact && Math.abs(amount) >= 1_000_000_000) return `${currency === "VND" ? "₫" : "$"}${(amount / 1_000_000_000).toFixed(1)}B`;
  if (compact && Math.abs(amount) >= 1_000_000) return `${currency === "VND" ? "₫" : "$"}${(amount / 1_000_000).toFixed(1)}M`;
  if (compact && Math.abs(amount) >= 1_000) return `${currency === "VND" ? "₫" : "$"}${(amount / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", { style: "currency", currency, maximumFractionDigits: currency === "VND" ? 0 : 2 }).format(amount);
}

function marketMoney(valueUsdBillions: number, currency: Currency) {
  if (currency === "VND") {
    const trillionVnd = (valueUsdBillions * FX_VND) / 1_000_000_000;
    return trillionVnd >= 1 ? `₫${trillionVnd.toFixed(1)}T` : `₫${(trillionVnd * 1_000).toFixed(1)}B`;
  }
  return valueUsdBillions >= 1 ? `$${valueUsdBillions.toFixed(1)}B` : `$${(valueUsdBillions * 1_000).toFixed(1)}M`;
}

function percent(value: number) {
  return `${value.toFixed(value < 1 ? 2 : 0)}%`;
}

function unitLabel(currency: Currency) {
  return currency === "USD" ? "USD" : "VND";
}

function Explain({ children }: { children: React.ReactNode }) {
  return (
    <details className="ref-explain">
      <summary><CircleHelp size={12} /> Explain data</summary>
      <p>{children}</p>
    </details>
  );
}

function SliderCard({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  tone = "blue",
  hint,
  suffix,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  tone?: string;
  hint: string;
  suffix?: string;
}) {
  const ratio = ((value - min) / Math.max(max - min, 1)) * 100;
  return (
    <article className={`ref-slider-card tone-${tone}`}>
      <div className="ref-card-heading">
        <strong>{label}</strong>
        <Explain>{hint}</Explain>
        <span>{display}{suffix}</span>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--range-progress": `${ratio}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="ref-range-labels">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
      <small>{hint}</small>
    </article>
  );
}

function MetricCard({
  icon,
  label,
  title,
  value,
  suffix,
  tone,
  badge,
  children,
  explain,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  value: string;
  suffix?: string;
  tone: string;
  badge: string;
  children: React.ReactNode;
  explain: string;
}) {
  return (
    <article className={`ref-metric-card tone-${tone}`}>
      <div className="ref-metric-head">
        <div className="ref-metric-icon">{icon}</div>
        <div>
          <strong>{label}</strong>
          <h3>{title}</h3>
        </div>
        <span className="ref-badge">{badge}</span>
      </div>
      <Explain>{explain}</Explain>
      <div className="ref-metric-value">
        {value}<small>{suffix}</small>
      </div>
      <p>{children}</p>
    </article>
  );
}

export function MarketLab() {
  const [active, setActive] = useState<SlideId>("cover");
  const [tamTab, setTamTab] = useState<TamTab>("audience");
  const [financialTab, setFinancialTab] = useState<FinancialTab>("growth");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [theme, setTheme] = useState<Theme>("light");
  const [horizon, setHorizon] = useState<Horizon>("3Y");
  const [caseId, setCaseId] = useState<CaseId>("base");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [tam, setTam] = useState(12.1);
  const [specializedShare, setSpecializedShare] = useState(19);
  const [activeUserPool, setActiveUserPool] = useState(1.8);
  const [paidPenetration, setPaidPenetration] = useState(3);
  const [monthlyPrice, setMonthlyPrice] = useState(2.99);
  const [optimisePrice, setOptimisePrice] = useState(9.99);
  const [teamModelPrice, setTeamModelPrice] = useState(49);
  const [starterMix, setStarterMix] = useState(65);
  const [optimiseMix, setOptimiseMix] = useState(32);
  const [averageAddonSpend, setAverageAddonSpend] = useState(1);
  const [freemiumConversion, setFreemiumConversion] = useState(3);
  const [annualDiscount, setAnnualDiscount] = useState(17);
  const [simulatedSpend, setSimulatedSpend] = useState(0);
  const [purchaseLog, setPurchaseLog] = useState<{ name: string; price: number }[]>([]);
  const [sessionCost, setSessionCost] = useState(0.006);
  const [sessionsPerMonth, setSessionsPerMonth] = useState(18);
  const [teamSize, setTeamSize] = useState(6);
  const [devSalary, setDevSalary] = useState(30_000);

  const activeCase = cases[caseId];
  const teamMix = Math.max(0, 100 - starterMix - optimiseMix);
  const annualPlanUptake = 55;
  const subscriptionArpuMonthly = (monthlyPrice * starterMix) / 100 + (optimisePrice * optimiseMix) / 100 + (teamModelPrice * teamMix) / 100;
  const arpu = (subscriptionArpuMonthly * (1 - (annualDiscount / 100) * (annualPlanUptake / 100)) + averageAddonSpend) * 12;
  const model = useMemo(() => {
    const sam = (tam * specializedShare) / 100;
    const som1 = (sam * activeCase.year1) / 100;
    const som3 = (sam * activeCase.year3) / 100;
    const som5 = (sam * activeCase.year5) / 100;
    const selectedSom = horizon === "1Y" ? som1 : horizon === "3Y" ? som3 : som5;
    const selectedShare = horizon === "1Y" ? activeCase.year1 : horizon === "3Y" ? activeCase.year3 : activeCase.year5;
    const blendedArpu = (arpu * activeCase.arpu) / cases.base.arpu;
    const monthlyRevenue = blendedArpu / 12;
    const ltv = (monthlyRevenue * (activeCase.margin / 100)) / (activeCase.churn / 100);
    const payback = activeCase.cac / Math.max((monthlyRevenue * activeCase.margin) / 100, 0.01);
    return {
      sam,
      som1,
      som3,
      som5,
      selectedSom,
      selectedShare,
      blendedArpu,
      monthlyRevenue,
      subscriptionArpuMonthly,
      teamMix,
      ltv,
      payback,
      selectedUsers: (selectedSom * 1_000_000_000) / blendedArpu,
      aiCostMonthly: sessionCost * sessionsPerMonth,
      hcmcOpex: teamSize * devSalary,
    };
  }, [activeCase, arpu, devSalary, horizon, sessionCost, sessionsPerMonth, specializedShare, subscriptionArpuMonthly, tam, teamMix, teamSize]);

  useEffect(() => {
    const handleThemeChange = () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(current === "dark" ? "dark" : "light");
    };
    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("aissessor:theme", nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  function navigate(id: SlideId) {
    setActive(id);
    setMobileOpen(false);
  }

  function setCase(next: CaseId) {
    setCaseId(next);
  }

  function resetDefaults() {
    setTam(12.1);
    setSpecializedShare(19);
    setActiveUserPool(1.8);
    setPaidPenetration(3);
    setMonthlyPrice(2.99);
    setOptimisePrice(9.99);
    setTeamModelPrice(49);
    setStarterMix(65);
    setOptimiseMix(32);
    setAverageAddonSpend(1);
    setFreemiumConversion(3);
    setAnnualDiscount(17);
    setSimulatedSpend(0);
    setPurchaseLog([]);
    setSessionCost(0.006);
    setSessionsPerMonth(18);
    setTeamSize(6);
    setDevSalary(30_000);
    setCaseId("base");
    setHorizon("3Y");
  }

  function purchaseAddon(name: string, price: number) {
    setSimulatedSpend((current) => Number((current + price).toFixed(2)));
    setPurchaseLog((current) => [{ name, price }, ...current].slice(0, 4));
  }

  function resetSimulator() {
    setSimulatedSpend(0);
    setPurchaseLog([]);
  }

  function exportCsv() {
    const rows = [
      ["AIssessor market model", "value", "unit", "notes"],
      ["TAM", tam, "USD bn", "Global consumer AI spend"],
      ["Specialized share", specializedShare, "%", "SAM / TAM"],
      ["SAM", model.sam, "USD bn", "Specialized AI tools"],
      ["SOM Year 1", model.som1, "USD bn", "Share of SAM"],
      ["SOM Year 3", model.som3, "USD bn", "Share of SAM"],
      ["SOM Year 5", model.som5, "USD bn", "Share of SAM"],
      ["Starter price", monthlyPrice, "USD / month", "Public list price"],
      ["Optimise price", optimisePrice, "USD / month", "Public list price"],
      ["Team modeled equivalent", teamModelPrice, "USD / month", "Internal ARPU assumption; customer price remains custom"],
      ["Starter mix", starterMix, "% of payers", "Operating assumption"],
      ["Optimise mix", optimiseMix, "% of payers", "Operating assumption"],
      ["Team mix", teamMix, "% of payers", "Calculated remainder"],
      ["Average add-on spend", averageAddonSpend, "USD / payer / month", "Operating assumption"],
      ["ARPU", model.blendedArpu, "USD / payer / year", "Blended pricing and case assumption"],
      ["Gross margin", activeCase.margin, "%", "Operating assumption"],
      ["CAC", activeCase.cac, "USD / paying user", "Operating assumption"],
      ["Monthly churn", activeCase.churn, "%", "Operating assumption"],
      ["AI inference cost", sessionCost, "USD / session", "Operating assumption"],
      ["HCMC team size", teamSize, "people", "Operating assumption"],
      ["HCMC team OPEX", model.hcmcOpex, "USD / year", "Team size × annual salary"],
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aissessor-market-model.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function pitchSummary() {
    return [
      "AIssessor / INVESTOR PITCH SUMMARY",
      `Case: ${activeCase.label} · Plan: ${horizon} · Display currency: ${unitLabel(currency)} (canonical model in USD)`,
      "",
      "1. EXECUTIVE MARKET OPPORTUNITY",
      `TAM: ${marketMoney(tam, currency)} — global consumer AI spend baseline`,
      `SAM: ${marketMoney(model.sam, currency)} — ${specializedShare}% of TAM for specialized AI tools`,
      `SOM: ${marketMoney(model.selectedSom, currency)} ARR — ${model.selectedShare}% SAM capture in ${horizon === "1Y" ? "Year 1" : horizon === "3Y" ? "Year 3" : "Year 5"}`,
      "",
      "2. FREEMIUM & PRICING ARCHITECTURE",
      `Free Preview: 1 guided strategy, no card required · Paid conversion assumption: ${freemiumConversion}%`,
      `Starter: ${money(monthlyPrice, currency)} / month · Optimise: ${money(optimisePrice, currency)} / month · Team: custom quote`,
      `Modeled payer mix: Starter ${starterMix}% · Optimise ${optimiseMix}% · Team ${teamMix}%`,
      `Team ARPU equivalent: ${money(teamModelPrice, currency)} / month (internal model only) · Average add-ons: ${money(averageAddonSpend, currency)} / payer / month`,
      `Blended ARPU: ${money(model.blendedArpu, currency)} / payer / year · Annual discount: ${annualDiscount}% at ${annualPlanUptake}% uptake`,
      "",
      "3. CORE UNIT ECONOMICS",
      `Gross margin: ${activeCase.margin}% · LTV: ${money(model.ltv, currency)} · CAC: ${money(activeCase.cac, currency)}`,
      `LTV : CAC: ${(model.ltv / Math.max(activeCase.cac, 1)).toFixed(1)}x · CAC payback: ${model.payback.toFixed(1)} months`,
      `AI inference cost: ${money(sessionCost, currency)} / session · ${sessionsPerMonth} sessions / user / month`,
      "",
      "4. COMPETITIVE POSITION",
      "Direct: OpenRouter, Artificial Analysis, AI Model Comparison · Discovery: Futurepedia, Toolify",
      "Substitutes: ChatGPT, Claude, Gemini, Poe · Wedge: structured evidence, current pricing, workflow decomposition, and stack optimisation",
      "",
      "5. VIETNAM-FIRST EXECUTION",
      `HCMC team: ${teamSize} people · estimated delivery OPEX: ${money(model.hcmcOpex, currency)} / year`,
      `Year-plan paying users: ${Math.round(model.selectedUsers).toLocaleString()} · Target ARR: ${marketMoney(model.selectedSom, currency)}`,
      "",
      "Planning note: TAM/SAM are research-backed market framing; capture, pricing mix, ARPU, conversion, costs, CAC, churn, margin, and HCMC OPEX are editable operating assumptions.",
    ].join("\n");
  }

  async function copyPitch() {
    try {
      await navigator.clipboard.writeText(pitchSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const activeIndex = slides.findIndex((slide) => slide.id === active);
  function moveSlide(direction: -1 | 1) {
    navigate(slides[(activeIndex + direction + slides.length) % slides.length].id);
  }

  return (
    <main className={`reference-deck ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <header className="ref-header">
        <div className="ref-brand" role="button" tabIndex={0} onClick={() => navigate("cover")} aria-label="AIssessor Home">
          <div className="ref-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 2000 2000" className="ref-brand-svg">
              <path d="M1215.68,0v302.41h-429.21v544.88h-393.24v544.88H0v607.84h607.84v-544.88h301.92v277.57h305.92v267.31h784.32V0h-784.32ZM1001.08,1124.85v-214.6h214.6v214.6h-214.6Z" />
            </svg>
          </div>
          <div>
            <strong>AIssessor</strong>
            <span>[ MARKET MODEL ]</span>
          </div>
        </div>

        <button
          className="ref-mobile-menu"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <nav className={`ref-slide-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Pitch deck slides">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={active === slide.id ? "is-active" : ""}
              onClick={() => navigate(slide.id)}
            >
              <b>0{index + 1}</b>
              <span>{slide.label}</span>
            </button>
          ))}
        </nav>

        <div className="ref-controls">
          <div className="ref-control-row">
            <div className="ref-segment">
              <button className={currency === "USD" ? "is-active" : ""} onClick={() => setCurrency("USD")}>
                $ USD
              </button>
              <button className={currency === "VND" ? "is-active" : ""} onClick={() => setCurrency("VND")}>
                ₫ VND
              </button>
            </div>
            <div className="ref-segment">
              <span className="ref-control-label">Horizon:</span>
              {(["1Y", "3Y", "5Y"] as Horizon[]).map((item) => (
                <button key={item} className={horizon === item ? "is-active" : ""} onClick={() => setHorizon(item)}>
                  {item === "1Y" ? "1-Year" : item === "3Y" ? "3-Years" : "5-Years"}
                </button>
              ))}
            </div>
          </div>
          <div className="ref-control-row">
            <div className="ref-segment">
              <span className="ref-control-label">Scenario:</span>
              {(Object.keys(cases) as CaseId[]).map((item) => (
                <button key={item} className={caseId === item ? "is-active" : ""} onClick={() => setCase(item)}>
                  {cases[item].label}
                </button>
              ))}
            </div>
            <button className="ref-outline-button" onClick={() => setActive("strategy")}>
              <Sparkles size={13} /> Strategy
            </button>
          </div>
          <div className="ref-control-row ref-action-row">
            <button className="ref-primary-button" onClick={() => setPitchOpen(true)}>
              <Clipboard size={14} /> Pitch summary
            </button>
            <button
              className="ref-icon-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="ref-outline-button ref-export" onClick={exportCsv}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <section className="ref-slide-stage">
        {active === "cover" && (
          <div className="ref-slide ref-cover-slide">
            <div className="ref-hero-card">
              <span className="ref-kicker">
                <span className="ref-kicker-dot" />
                [ AI TOOLS × DECISION INTELLIGENCE ]
              </span>
              <h1>
                AIssessor Market<br />
                <em>Pitch Deck</em>
              </h1>
              <p>
                Size the market for evidence-backed AI tool selection, quantify the recurring revenue engine, and pressure-test a capital-efficient Vietnam-first path to scale.
              </p>
              <div className="ref-hero-meta">
                <span><Pin size={13} /> Ho Chi Minh City, Vietnam</span>
                <span><Zap size={13} /> MVP Market Model</span>
                <span className="ref-live-pill"><i /> Live Model</span>
              </div>
            </div>

            <div className="ref-section-label">
              <Globe2 size={16} /> Executive Market Sizing <span>[ Slide 01 of 06 ]</span>
            </div>

            <div className="ref-metric-grid">
              <MetricCard
                icon={<Globe2 size={20} />}
                label="TAM"
                title="Total Addressable Market"
                value={marketMoney(tam, currency)}
                suffix=" / year"
                tone="blue"
                badge="Global Baseline"
                explain="Top-down ceiling using researched global consumer AI spend baseline. Market context, not direct AIssessor revenue."
              >
                Global consumer AI spend across assistants, productivity, and specialized AI stacks.
              </MetricCard>

              <MetricCard
                icon={<Target size={20} />}
                label="SAM"
                title="Serviceable Addressable"
                value={marketMoney(model.sam, currency)}
                suffix=" / year"
                tone="indigo"
                badge="Specialized AI"
                explain="SAM is TAM multiplied by specialized-tool share. Category where AIssessor creates decision and trust value."
              >
                The specialized AI tool pool where AIssessor adds decision, benchmark, and fit context.
              </MetricCard>

              <MetricCard
                icon={<Rocket size={20} />}
                label="SOM TARGET"
                title="Serviceable Obtainable"
                value={marketMoney(model.selectedSom, currency)}
                suffix={` ARR (${horizon === "1Y" ? "Yr 1" : horizon === "3Y" ? "Yr 3" : "Yr 5"})`}
                tone="mint"
                badge={`${horizon} Plan`}
                explain="SOM scenario output based on selected case, horizon, and editable share of SAM."
              >
                {percent(model.selectedShare)} SAM capture · {Math.round(model.selectedUsers).toLocaleString()} paying users modeled.
              </MetricCard>
            </div>

            <div className="ref-cover-insight">
              <div>
                <BarChart3 size={16} />
                <strong>The Core Thesis</strong>
              </div>
              <p>
                AI adoption is accelerating, but tool selection is fragmented. AIssessor turns “which AI should I use?” into an explainable, data-backed decision layer.
              </p>
              <button className="ref-text-button" onClick={() => navigate("strategy")}>
                Read the strategy <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {active === "tamsam" && (
          <div className="ref-slide ref-tamsam-slide">
            <div className="ref-slide-title">
              <div>
                <span className="ref-kicker">
                  <Layers3 size={13} /> [ SLIDE 02 · INTERACTIVE WORKBENCH ]
                </span>
                <h2>Size the market, then test the wedge.</h2>
                <p>Fine-tune audience depth, monetization, AI operating cost, and the Vietnam-first execution plan.</p>
              </div>
              <div className="ref-slide-number">[ Slide 02 of 06 ]</div>
            </div>

            <div className="ref-panel">
              <div className="ref-subtabs">
                {tamTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={tamTab === tab.id ? "is-active" : ""}
                      onClick={() => setTamTab(tab.id)}
                    >
                      <Icon size={15} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="ref-panel-body">
                {tamTab === "audience" && (
                  <>
                    <div className="ref-panel-heading">
                      <div>
                        <h3>Global AI Audience Parameters</h3>
                        <p>Research baseline → specialized tool pool → AIssessor addressable wedge.</p>
                      </div>
                      <button className="ref-reset" onClick={resetDefaults}>
                        Reset defaults
                      </button>
                    </div>
                    <div className="ref-control-layout">
                      <div className="ref-slider-grid">
                        <SliderCard
                          label="Global consumer AI spend"
                          value={tam}
                          display={marketMoney(tam, currency)}
                          min={0}
                          max={30}
                          step={0.1}
                          onChange={setTam}
                          tone="blue"
                          hint="Menlo Ventures 2025 consumer AI spend baseline · canonical input USD bn"
                        />
                        <SliderCard
                          label="Specialized AI tools share"
                          value={specializedShare}
                          display={`${specializedShare}%`}
                          min={0}
                          max={50}
                          onChange={setSpecializedShare}
                          tone="indigo"
                          hint="Specialized tools as a share of consumer AI spend"
                          suffix="%"
                        />
                        <SliderCard
                          label="AI users globally"
                          value={activeUserPool}
                          display={`${activeUserPool.toFixed(1)}B`}
                          min={0.5}
                          max={3}
                          step={0.1}
                          onChange={setActiveUserPool}
                          tone="blue"
                          hint="People who have used an AI product worldwide"
                        />
                        <SliderCard
                          label="Paid penetration"
                          value={paidPenetration}
                          display={`${paidPenetration}%`}
                          min={0}
                          max={10}
                          step={0.5}
                          onChange={setPaidPenetration}
                          tone="mint"
                          hint="Implied paid users = AI users × paid penetration"
                          suffix="%"
                        />
                      </div>
                      <AudienceFunnel
                        tam={tam}
                        sam={model.sam}
                        currency={currency}
                        activeUserPool={activeUserPool}
                        paidPenetration={paidPenetration}
                      />
                    </div>
                    <div className="ref-chip-row">
                      <span className="ref-chip is-selected">Knowledge workers</span>
                      <span className="ref-chip is-selected">Students & creators</span>
                      <span className="ref-chip is-selected">SMB teams</span>
                      <span className="ref-chip">Enterprise procurement</span>
                    </div>
                  </>
                )}

                {tamTab === "pricing" && (
                  <>
                    <div className="ref-panel-heading">
                      <div>
                        <h3>Subscription & AI Workflow Monetization</h3>
                        <p>Model recurring revenue per paying account without confusing list price, ARPU, and ARR.</p>
                      </div>
                      <span className="ref-data-tag">{unitLabel(currency)} DISPLAY · USD CANONICAL</span>
                    </div>
                    <div className="ref-control-layout">
                      <div className="ref-slider-grid">
                        <SliderCard
                          label="Starter subscription"
                          value={monthlyPrice}
                          display={money(monthlyPrice, currency)}
                          min={1}
                          max={10}
                          step={0.01}
                          onChange={setMonthlyPrice}
                          tone="blue"
                          hint="Public list price · USD per account per month"
                        />
                        <SliderCard
                          label="Optimise subscription"
                          value={optimisePrice}
                          display={money(optimisePrice, currency)}
                          min={5}
                          max={30}
                          step={0.01}
                          onChange={setOptimisePrice}
                          tone="indigo"
                          hint="Recommended recurring plan · USD per account per month"
                        />
                        <SliderCard
                          label="Average add-on spend"
                          value={averageAddonSpend}
                          display={money(averageAddonSpend, currency)}
                          min={0}
                          max={10}
                          step={0.25}
                          onChange={setAverageAddonSpend}
                          tone="mint"
                          hint="Usage packs and premium reports per paying account per month"
                        />
                        <SliderCard
                          label="Free Preview conversion"
                          value={freemiumConversion}
                          display={`${freemiumConversion}%`}
                          min={0.5}
                          max={12}
                          step={0.5}
                          onChange={setFreemiumConversion}
                          tone="blue"
                          hint="Free Preview users converting to any paid plan"
                          suffix="%"
                        />
                      </div>
                      <RevenueMix arpu={model.blendedArpu} currency={currency} />
                    </div>
                    <div className="ref-callout">
                      <WalletCards size={16} />
                      <span>
                        <strong>Blended ARPU: {money(model.blendedArpu, currency)} / payer / year.</strong> Uses editable plan mix, {annualDiscount}% annual discount at {annualPlanUptake}% uptake, add-on spend, and selected scenario.
                      </span>
                    </div>
                  </>
                )}

                {tamTab === "costs" && (
                  <>
                    <div className="ref-panel-heading">
                      <div>
                        <h3>LLM Operating Cost & Unit Economics</h3>
                        <p>Make model usage visible: inference cost, sessions, acquisition cost, retention, and payback.</p>
                      </div>
                      <span className="ref-data-tag">{unitLabel(currency)} DISPLAY · USD CANONICAL</span>
                    </div>
                    <div className="ref-control-layout">
                      <div className="ref-slider-grid">
                        <SliderCard
                          label="AI inference cost / session"
                          value={sessionCost}
                          display={money(sessionCost, currency)}
                          min={0.001}
                          max={0.05}
                          step={0.001}
                          onChange={setSessionCost}
                          tone="blue"
                          hint="Estimated cost per AIssessor recommendation or comparison session"
                        />
                        <SliderCard
                          label="Sessions / user / month"
                          value={sessionsPerMonth}
                          display={`${sessionsPerMonth} / mo`}
                          min={1}
                          max={60}
                          onChange={setSessionsPerMonth}
                          tone="indigo"
                          hint="Monthly AI-assisted decision sessions"
                        />
                        <SliderCard
                          label="CAC / paying user"
                          value={activeCase.cac}
                          display={money(activeCase.cac, currency)}
                          min={5}
                          max={60}
                          onChange={() => undefined}
                          tone="amber"
                          hint="Case assumption · paid acquisition and app-store blended cost"
                        />
                        <SliderCard
                          label="Monthly churn"
                          value={activeCase.churn}
                          display={`${activeCase.churn}%`}
                          min={1}
                          max={12}
                          step={0.5}
                          onChange={() => undefined}
                          tone="amber"
                          hint="Case assumption · monthly paying-user churn"
                          suffix="%"
                        />
                      </div>
                      <UnitEconomics
                        ltv={model.ltv}
                        payback={model.payback}
                        cac={activeCase.cac}
                        margin={activeCase.margin}
                        aiCost={model.aiCostMonthly}
                        currency={currency}
                      />
                    </div>
                  </>
                )}

                {tamTab === "targets" && (
                  <>
                    <div className="ref-panel-heading">
                      <div>
                        <h3>SOM Penetration & Ho Chi Minh City Hub</h3>
                        <p>Translate market share into paying users, ARR, and a capital-efficient build plan.</p>
                      </div>
                      <span className="ref-data-tag">CASE: {activeCase.label.toUpperCase()}</span>
                    </div>
                    <div className="ref-target-layout">
                      <div className="ref-target-grid">
                        <TargetCard
                          year="Year 1"
                          share={activeCase.year1}
                          arr={model.som1}
                          users={(model.som1 * 1_000_000_000) / model.blendedArpu}
                          currency={currency}
                          selected={horizon === "1Y"}
                          onClick={() => setHorizon("1Y")}
                        />
                        <TargetCard
                          year="Year 3"
                          share={activeCase.year3}
                          arr={model.som3}
                          users={(model.som3 * 1_000_000_000) / model.blendedArpu}
                          currency={currency}
                          selected={horizon === "3Y"}
                          onClick={() => setHorizon("3Y")}
                        />
                        <TargetCard
                          year="Year 5"
                          share={activeCase.year5}
                          arr={model.som5}
                          users={(model.som5 * 1_000_000_000) / model.blendedArpu}
                          currency={currency}
                          selected={horizon === "5Y"}
                          onClick={() => setHorizon("5Y")}
                        />
                        <SliderCard
                          label="HCMC product & research team"
                          value={teamSize}
                          display={`${teamSize} people`}
                          min={2}
                          max={20}
                          onChange={setTeamSize}
                          tone="blue"
                          hint="Planning assumption for an initial AIssessor hub"
                        />
                      </div>
                      <HubEfficiency
                        teamSize={teamSize}
                        salary={devSalary}
                        setSalary={setDevSalary}
                        hcmcOpex={model.hcmcOpex}
                        currency={currency}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {active === "monetization" && (
          <div className="ref-slide ref-monetization-slide">
            <div className="ref-slide-title">
              <div>
                <span className="ref-kicker">
                  <WalletCards size={13} /> [ SLIDE 03 · FREEMIUM & WORKFLOW REVENUE ]
                </span>
                <h2>Monetize repeated AI decisions, not access to a directory.</h2>
                <p>A Free Preview proves value; subscriptions expand workflow depth; usage add-ons monetize high-intent moments.</p>
              </div>
              <div className="ref-slide-number">[ Slide 03 of 06 ]</div>
            </div>

            <section className="ref-revenue-architecture">
              <span>
                <Sparkles size={13} /> [ REVENUE ARCHITECTURE ]
              </span>
              <h3>Low-friction entry. Clear upgrade moments. Expansion without gimmicks.</h3>
              <p>
                One guided strategy is free and requires no card. Teams pay when AIssessor becomes a repeated workflow: comparing tools, estimating cost, governing usage, and producing decision-ready reports.
              </p>
              <div>
                <b>Free Preview → Starter → Optimise → Team</b>
                <i />
                <strong>{freemiumConversion}% modeled paid conversion</strong>
              </div>
            </section>

            <div className="ref-tier-matrix-head">
              <div>
                <Workflow size={17} />
                <h3>Subscription Tier Matrix</h3>
              </div>
              <span>PUBLIC PRICES SHOWN PER ACCOUNT / MONTH</span>
            </div>

            <div className="ref-tier-grid">
              <TierCard
                eyebrow="STARTER"
                name="AI Explorer"
                price={money(monthlyPrice, currency)}
                subtitle="For individuals validating a few high-value AI choices"
                tone="blue"
                features={[
                  "3 AI strategies / month",
                  "Recommendations with fit rationale",
                  "Cost estimates & AI alternatives",
                  "Basic decision workflow",
                  "Save up to 10 strategies",
                ]}
                footer="Converts Free Preview users"
              />
              <TierCard
                eyebrow="OPTIMISE"
                name="AI Optimiser"
                price={money(optimisePrice, currency)}
                subtitle="For professionals who run AI decisions every week"
                tone="indigo"
                featured
                features={[
                  "20 AI strategies / month",
                  "Everything in Starter",
                  "Full compare → select → track workflow",
                  "Cost & performance comparison",
                  "Subscription optimisation & savings",
                  "Monthly AI updates",
                  "Unlimited saved strategies",
                ]}
                footer="Primary recurring revenue engine"
              />
              <TierCard
                eyebrow="TEAM"
                name="AIssessor Workspace"
                price="Custom"
                subtitle="For teams governing shared tools, spend, and outcomes"
                tone="mint"
                features={[
                  "Custom users, usage & strategy limits",
                  "Everything in Optimise",
                  "Shared workspace with roles",
                  "Team AI spend & usage tracking",
                  "Approval policies & team recommendations",
                  "Custom reports and export controls",
                ]}
                footer={`${money(teamModelPrice, currency)} / mo equivalent modeled in ARPU`}
              />
            </div>

            <section className="ref-addon-simulator">
              <div className="ref-addon-head">
                <div>
                  <Gift size={18} />
                  <div>
                    <h3>Interactive Usage & Add-on Simulator</h3>
                    <p>Tests expansion revenue from urgent or high-value jobs without forcing an immediate plan upgrade.</p>
                  </div>
                </div>
                <div>
                  <span>Simulated add-on spend:</span>
                  <b>{money(simulatedSpend, currency)}</b>
                  <button onClick={resetSimulator} aria-label="Reset add-on simulator" title="Reset simulator">
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              <div className="ref-addon-layout">
                <div className="ref-workflow-preview">
                  <span className="ref-mini-label">
                    <BrainCircuit size={13} /> Active recommendation context
                  </span>
                  <div className="ref-workflow-card">
                    <span>Marketing Workflow</span>
                    <h4>Choose the best AI video stack under a monthly budget.</h4>
                    <div>
                      <b>Fit score: 91</b>
                      <b>3 tools compared</b>
                      <b>{money(42, currency)} potential monthly saving</b>
                    </div>
                  </div>
                  <small>
                    <Lock size={12} /> Evidence trail, pricing assumptions, and decision history remain attached to the strategy.
                  </small>
                </div>

                <div className="ref-addon-market">
                  <div className="ref-addon-option-grid">
                    <button onClick={() => purchaseAddon("5-strategy pack", 2.99)}>
                      <Plus size={14} />
                      <span>
                        <b>5-strategy pack</b>
                        <small>One-time capacity</small>
                      </span>
                      <strong>{money(2.99, currency)}</strong>
                    </button>
                    <button onClick={() => purchaseAddon("AI spend audit", 4.99)}>
                      <Gauge size={14} />
                      <span>
                        <b>AI spend audit</b>
                        <small>Find duplicate spend</small>
                      </span>
                      <strong>{money(4.99, currency)}</strong>
                    </button>
                    <button onClick={() => purchaseAddon("Extra Team seat", 8)}>
                      <Users size={14} />
                      <span>
                        <b>Extra Team seat</b>
                        <small>Monthly modeled add-on</small>
                      </span>
                      <strong>{money(8, currency)}</strong>
                    </button>
                    <button onClick={() => purchaseAddon("Expert-ready report", 19)}>
                      <FileText size={14} />
                      <span>
                        <b>Expert report</b>
                        <small>Exportable dossier</small>
                      </span>
                      <strong>{money(19, currency)}</strong>
                    </button>
                  </div>

                  <div className="ref-purchase-log">
                    <strong>Simulated Transaction Log</strong>
                    {purchaseLog.length ? (
                      purchaseLog.map((item, index) => (
                        <span key={`${item.name}-${index}`}>
                          <Check size={12} /> {item.name}
                          <b>{money(item.price, currency)}</b>
                        </span>
                      ))
                    ) : (
                      <p>Select any add-on above to test simulated expansion revenue.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="ref-addon-formula">
                <span>Modeled ARPU = weighted subscriptions + average add-ons − annual discount impact</span>
                <b>{money(model.blendedArpu, currency)} / payer / year</b>
              </div>
            </section>

            <section className="ref-freemium-economics">
              <div className="ref-economics-head">
                <div>
                  <TrendingUp size={17} />
                  <h3>Freemium Unit Economics & Margin Control</h3>
                </div>
                <span>
                  PAID CONVERSION: <b>{freemiumConversion}%</b>
                </span>
              </div>
              <div className="ref-econ-controls">
                <SliderCard
                  label="Starter price"
                  value={monthlyPrice}
                  display={money(monthlyPrice, currency)}
                  min={1}
                  max={10}
                  step={0.01}
                  onChange={setMonthlyPrice}
                  tone="blue"
                  hint="USD per account per month"
                />
                <SliderCard
                  label="Average monthly add-ons"
                  value={averageAddonSpend}
                  display={money(averageAddonSpend, currency)}
                  min={0}
                  max={10}
                  step={0.25}
                  onChange={setAverageAddonSpend}
                  tone="indigo"
                  hint="Usage packs and premium reports per payer"
                />
                <SliderCard
                  label="Paid conversion"
                  value={freemiumConversion}
                  display={`${freemiumConversion}%`}
                  min={0.5}
                  max={12}
                  step={0.5}
                  onChange={setFreemiumConversion}
                  tone="mint"
                  hint="Free Preview accounts converting to paid"
                  suffix="%"
                />
              </div>
              <div className="ref-econ-stats">
                <span>
                  <small>Blended ARPU / yr</small>
                  <b>{money(model.blendedArpu, currency)}</b>
                </span>
                <span>
                  <small>Gross Margin</small>
                  <b>{activeCase.margin}%</b>
                </span>
                <span>
                  <small>LTV : CAC</small>
                  <b>{(model.ltv / Math.max(activeCase.cac, 1)).toFixed(1)}x</b>
                </span>
                <span>
                  <small>{horizon} ARR Target</small>
                  <b>{marketMoney(model.selectedSom, currency)}</b>
                </span>
              </div>
              <p className="ref-assumption">
                Operating assumptions: payer mix {starterMix}% Starter / {optimiseMix}% Optimise / {teamMix}% Team; Team modeled at {money(teamModelPrice, currency)} / month; {annualDiscount}% annual discount at {annualPlanUptake}% uptake.
              </p>
            </section>
          </div>
        )}

        {active === "finance" && (
          <div className="ref-slide ref-financial-slide">
            <div className="ref-slide-title">
              <div>
                <span className="ref-kicker">
                  <Calculator size={13} /> [ SLIDE 04 · FINANCIAL VISUALIZATIONS & DIAGNOSTICS ]
                </span>
                <h2>Show the growth path—and the durability of that growth.</h2>
                <p>Multi-year ARR trajectories, competitive benchmark matrix, regional GTM split, and diagnostic unit economics.</p>
              </div>
              <div className="ref-slide-number">[ Slide 04 of 06 ]</div>
            </div>

            <section className="ref-financial-panel">
              <div className="ref-financial-toolbar">
                <div>
                  <span className="ref-mini-icon"><TrendingUp size={15} /></span>
                  <strong>[ INTERACTIVE VISUAL ANALYTICS ]</strong>
                  <Explain>Financial outputs update from the selected scenario, plan horizon, pricing mix, CAC, churn, gross margin, and AI usage assumptions.</Explain>
                </div>
                <div className="ref-financial-tabs">
                  {([
                    { id: "growth", label: "5-Yr Growth & ARR" },
                    { id: "competitors", label: "Competitor Matrix" },
                    { id: "regions", label: "GTM Split" },
                    { id: "economics", label: "LTV / CAC / AI Cost" },
                  ] as { id: FinancialTab; label: string }[]).map((tab) => (
                    <button
                      key={tab.id}
                      className={financialTab === tab.id ? "is-active" : ""}
                      onClick={() => setFinancialTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ref-financial-body">
                {financialTab === "growth" && (
                  <FinancialGrowth
                    som1={model.som1}
                    som3={model.som3}
                    som5={model.som5}
                    arpu={model.blendedArpu}
                    aiCostMonthly={model.aiCostMonthly}
                    margin={activeCase.margin}
                    currency={currency}
                    horizon={horizon}
                    selectedSom={model.selectedSom}
                  />
                )}
                {financialTab === "competitors" && <CompetitorMatrix />}
                {financialTab === "regions" && <RegionalPlan selectedSom={model.selectedSom} currency={currency} />}
                {financialTab === "economics" && (
                  <FinancialDiagnostics
                    ltv={model.ltv}
                    payback={model.payback}
                    cac={activeCase.cac}
                    margin={activeCase.margin}
                    aiCost={model.aiCostMonthly}
                    monthlyRevenue={model.monthlyRevenue}
                    currency={currency}
                  />
                )}
              </div>
            </section>
          </div>
        )}

        {active === "competition" && (
          <div className="ref-slide ref-market-comparison-slide">
            <MarketComparisonDeck
              currency={currency}
              setCurrency={setCurrency}
              starterPrice={monthlyPrice}
              optimisePrice={optimisePrice}
              arpu={model.blendedArpu}
              ltv={model.ltv}
              cac={activeCase.cac}
            />
          </div>
        )}

        {active === "strategy" && (
          <StrategySlide
            currency={currency}
            teamSize={teamSize}
            setTeamSize={setTeamSize}
            salary={devSalary}
            setSalary={setDevSalary}
            hcmcOpex={model.hcmcOpex}
          />
        )}
      </section>

      <footer className="ref-footer">
        <div className="ref-footer-brand">
          <div className="ref-brand-mark ref-brand-mark-sm" aria-hidden="true">
            <svg viewBox="0 0 2000 2000" className="ref-brand-svg">
              <path d="M1215.68,0v302.41h-429.21v544.88h-393.24v544.88H0v607.84h607.84v-544.88h301.92v277.57h305.92v267.31h784.32V0h-784.32ZM1001.08,1124.85v-214.6h214.6v214.6h-214.6Z" />
            </svg>
          </div>
          <strong>AIssessor / Market Lab</strong>
          <i>•</i>
          <span>Ho Chi Minh City · AI Decision Intelligence</span>
        </div>

        <div className="ref-progress">
          {slides.map((slide) => (
            <button
              key={slide.id}
              aria-label={`Go to ${slide.label}`}
              className={slide.id === active ? "is-active" : ""}
              onClick={() => navigate(slide.id)}
            />
          ))}
        </div>

        <div className="ref-footer-actions">
          <button className="ref-secondary-button" disabled={activeIndex === 0} onClick={() => moveSlide(-1)}>
            <ArrowLeft size={13} /> Previous
          </button>
          <span>
            {activeIndex + 1} / {slides.length}
          </span>
          <button className="ref-primary-button" onClick={() => moveSlide(1)}>
            Next slide <ArrowRight size={13} />
          </button>
        </div>
      </footer>

      {pitchOpen && (
        <div className="ref-modal-backdrop" onClick={() => setPitchOpen(false)}>
          <div
            className="ref-pitch-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pitch-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ref-modal-header">
              <div className="ref-modal-icon">
                <Clipboard size={18} />
              </div>
              <div>
                <span className="ref-kicker">[ INVESTOR-READY OUTPUT ]</span>
                <h2 id="pitch-title">Investor Pitch Summary</h2>
                <p>Executive market brief formatted for investor decks and strategy memos</p>
              </div>
              <button className="ref-modal-close" onClick={() => setPitchOpen(false)} aria-label="Close pitch summary">
                <X size={18} />
              </button>
            </div>
            <pre className="ref-pitch-body">{pitchSummary()}</pre>
            <div className="ref-modal-footer">
              <span>Units validated · {unitLabel(currency)} display · USD canonical model</span>
              <button className="ref-primary-button" onClick={copyPitch}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy pitch summary"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AudienceFunnel({
  tam,
  sam,
  currency,
  activeUserPool,
  paidPenetration,
}: {
  tam: number;
  sam: number;
  currency: Currency;
  activeUserPool: number;
  paidPenetration: number;
}) {
  return (
    <div className="ref-visual-card">
      <div className="ref-card-heading">
        <strong>
          <BarChart3 size={14} /> Live TAM → SAM Funnel
        </strong>
        <span>{marketMoney(sam, currency)} SAM</span>
      </div>
      <div className="ref-funnel-visual">
        <div>
          <span>Global consumer AI</span>
          <b>{marketMoney(tam, currency)}</b>
          <i style={{ width: "100%" }} />
        </div>
        <div>
          <span>Specialized AI tools</span>
          <b>{marketMoney(sam, currency)}</b>
          <i style={{ width: `${Math.min((sam / tam) * 100 * 2, 100)}%` }} />
        </div>
        <div>
          <span>Paid-user cross-check</span>
          <b>{((activeUserPool * 1_000 * paidPenetration) / 100).toFixed(1)}M users</b>
          <i style={{ width: `${Math.max(paidPenetration * 4, 8)}%` }} />
        </div>
      </div>
      <div className="ref-visual-legend">
        <span>
          <b>{activeUserPool.toFixed(1)}B</b> AI users
        </span>
        <span>
          <b>{paidPenetration}%</b> pay today
        </span>
      </div>
    </div>
  );
}

function RevenueMix({ arpu, currency }: { arpu: number; currency: Currency }) {
  return (
    <div className="ref-visual-card ref-revenue-card">
      <div className="ref-card-heading">
        <strong>
          <WalletCards size={14} /> ARPU & Revenue Mix
        </strong>
        <span>ARPU: {money(arpu, currency)} / yr</span>
      </div>
      <div className="ref-revenue-bars">
        <div>
          <i style={{ height: "88%" }} />
          <span>Optimise</span>
          <b>{money(arpu * 0.7, currency, true)}</b>
        </div>
        <div>
          <i style={{ height: "58%" }} />
          <span>Add-ons</span>
          <b>{money(arpu * 0.2, currency, true)}</b>
        </div>
        <div>
          <i style={{ height: "34%" }} />
          <span>Starter</span>
          <b>{money(arpu * 0.1, currency, true)}</b>
        </div>
      </div>
      <div className="ref-visual-legend">
        <span>70% Optimise plan</span>
        <span>20% Usage & add-ons</span>
        <span>10% Starter subscriptions</span>
      </div>
    </div>
  );
}

function TierCard({
  eyebrow,
  name,
  price,
  subtitle,
  features,
  footer,
  tone,
  featured = false,
}: {
  eyebrow: string;
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  footer: string;
  tone: "blue" | "indigo" | "mint";
  featured?: boolean;
}) {
  return (
    <article className={`ref-tier-card tone-${tone} ${featured ? "is-featured" : ""}`}>
      {featured && (
        <span className="ref-tier-ribbon">
          <Sparkles size={11} /> [ RECOMMENDED ]
        </span>
      )}
      <div className="ref-tier-label">
        {tone === "mint" ? <Building2 size={14} /> : tone === "indigo" ? <Sparkles size={14} /> : <Zap size={14} />}{" "}
        [ {eyebrow} ]
      </div>
      <h4>{name}</h4>
      <p>{subtitle}</p>
      <div className="ref-tier-price">
        <strong>{price}</strong>
        {price !== "Custom" && <span>/ month</span>}
      </div>
      <div className="ref-tier-features">
        {features.map((feature) => (
          <span key={feature}>
            <Check size={13} /> {feature}
          </span>
        ))}
      </div>
      <div className="ref-tier-foot">{footer}</div>
    </article>
  );
}

function UnitEconomics({
  ltv,
  payback,
  cac,
  margin,
  aiCost,
  currency,
}: {
  ltv: number;
  payback: number;
  cac: number;
  margin: number;
  aiCost: number;
  currency: Currency;
}) {
  return (
    <div className="ref-visual-card ref-unit-card">
      <div className="ref-card-heading">
        <strong>
          <Gauge size={14} /> LTV vs CAC Economics
        </strong>
        <span>{(ltv / Math.max(cac, 1)).toFixed(1)}x ratio</span>
      </div>
      <div className="ref-ltv-bars">
        <div>
          <i style={{ height: `${Math.max((cac / Math.max(ltv, 1)) * 100, 8)}%` }} />
          <span>CAC</span>
          <b>{money(cac, currency)}</b>
        </div>
        <div>
          <i style={{ height: "88%" }} />
          <span>LTV</span>
          <b>{money(ltv, currency)}</b>
        </div>
      </div>
      <div className="ref-unit-stats">
        <span>
          <small>Gross Margin</small>
          <b>{margin}%</b>
        </span>
        <span>
          <small>Payback</small>
          <b>{payback.toFixed(1)} mo</b>
        </span>
        <span>
          <small>AI cost / user</small>
          <b>{money(aiCost, currency)} / mo</b>
        </span>
      </div>
    </div>
  );
}

function TargetCard({
  year,
  share,
  arr,
  users,
  currency,
  selected,
  onClick,
}: {
  year: string;
  share: number;
  arr: number;
  users: number;
  currency: Currency;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`ref-target-card ${selected ? "is-selected" : ""}`} onClick={onClick}>
      <div>
        <strong>{year} Penetration</strong>
        <span>{percent(share)}</span>
      </div>
      <b>{marketMoney(arr, currency)} ARR</b>
      <small>{Math.round(users).toLocaleString()} paying users · Click to select</small>
    </button>
  );
}

function HubEfficiency({
  teamSize,
  salary,
  setSalary,
  hcmcOpex,
  currency,
}: {
  teamSize: number;
  salary: number;
  setSalary: (value: number) => void;
  hcmcOpex: number;
  currency: Currency;
}) {
  return (
    <div className="ref-visual-card ref-hub-card">
      <div className="ref-card-heading">
        <strong>
          <Pin size={14} /> HCMC Hub Capital Efficiency
        </strong>
        <span>{money(hcmcOpex, currency, true)} / yr OPEX</span>
      </div>
      <div className="ref-hub-bars">
        <div>
          <span>US benchmark</span>
          <i style={{ height: "92%" }} />
          <b>{money(teamSize * 140_000, currency, true)}</b>
        </div>
        <div>
          <span>HCMC team</span>
          <i style={{ height: `${Math.max((hcmcOpex / Math.max(teamSize * 140_000, 1)) * 92, 14)}%` }} />
          <b>{money(hcmcOpex, currency, true)}</b>
        </div>
      </div>
      <label className="ref-inline-input">
        Annual dev salary
        <input
          type="number"
          min="10000"
          max="100000"
          step="1000"
          value={salary}
          onChange={(event) => setSalary(Number(event.target.value) || 0)}
        />
        <span>USD / engineer / yr</span>
      </label>
      <small className="ref-assumption">Planning model assumption · Replace with verified hiring plan when expanding.</small>
    </div>
  );
}

function FinancialGrowth({
  som1,
  som3,
  som5,
  arpu,
  aiCostMonthly,
  margin,
  currency,
  horizon,
  selectedSom,
}: {
  som1: number;
  som3: number;
  som5: number;
  arpu: number;
  aiCostMonthly: number;
  margin: number;
  currency: Currency;
  horizon: Horizon;
  selectedSom: number;
}) {
  const arr = [som1, Math.sqrt(som1 * som3), som3, Math.sqrt(som3 * som5), som5];
  const grossProfit = arr.map((value) => (value * margin) / 100);
  const llmCost = arr.map((value) => value * ((aiCostMonthly * 12) / Math.max(arpu, 0.01)));
  const max = Math.max(...arr) * 1.12;
  const x = (index: number) => 62 + index * 198;
  const y = (value: number) => 220 - (value / Math.max(max, 0.001)) * 170;
  const points = (values: number[]) => values.map((value, index) => `${x(index)},${y(value)}`).join(" ");

  return (
    <div className="ref-financial-view">
      <div className="ref-financial-view-head">
        <div>
          <span className="ref-kicker">[ 5-YEAR FORECAST ENGINE ]</span>
          <h3>Projected ARR vs Gross Profit vs AI Inference Overhead</h3>
          <p>Years 2 and 4 are geometric interpolations between the selected scenario anchors.</p>
        </div>
        <div className="ref-goal-card">
          <small>{horizon} Goal ARR</small>
          <b>{marketMoney(selectedSom, currency)}</b>
        </div>
      </div>
      <div className="ref-line-chart">
        <svg viewBox="0 0 900 260" role="img" aria-label="Five-year ARR, gross profit, and AI inference cost forecast">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line x1="62" x2="854" y1={220 - tick * 170} y2={220 - tick * 170} />
              <text x="8" y={224 - tick * 170}>
                {marketMoney(max * tick, currency)}
              </text>
            </g>
          ))}
          <polygon className="arr-area" points={`62,220 ${points(arr)} 854,220`} />
          <polyline className="arr-line" points={points(arr)} />
          <polyline className="profit-line" points={points(grossProfit)} />
          <polyline className="cost-line" points={points(llmCost)} />
          {arr.map((value, index) => (
            <g key={index}>
              <circle className="arr-dot" cx={x(index)} cy={y(value)} r="4" />
              <text className="year-label" x={x(index)} y="247">
                Year {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="ref-chart-legend">
        <span className="is-arr"><i /> ARR Target</span>
        <span className="is-profit"><i /> Gross Profit ({margin}%)</span>
        <span className="is-cost"><i /> AI Inference Cost</span>
        <b>Canonical model: USD · Display: {unitLabel(currency)}</b>
      </div>
    </div>
  );
}

function MatrixMark({ value }: { value: "yes" | "partial" | "no" }) {
  return (
    <span className={`ref-matrix-mark is-${value}`}>
      {value === "yes" ? <Check size={13} /> : value === "partial" ? "◐" : "—"}
    </span>
  );
}

function CompetitorMatrix() {
  const rows: {
    name: string;
    type: string;
    evidence: "yes" | "partial" | "no";
    pricing: "yes" | "partial" | "no";
    workflow: "yes" | "partial" | "no";
    stack: "yes" | "partial" | "no";
  }[] = [
    { name: "OpenRouter", type: "Direct / model routing", evidence: "yes", pricing: "yes", workflow: "partial", stack: "no" },
    { name: "Artificial Analysis", type: "Direct / benchmark data", evidence: "yes", pricing: "yes", workflow: "no", stack: "no" },
    { name: "AI Model Comparison", type: "Direct / comparison", evidence: "yes", pricing: "yes", workflow: "partial", stack: "no" },
    { name: "Futurepedia / Toolify", type: "Discovery directories", evidence: "partial", pricing: "partial", workflow: "no", stack: "no" },
    { name: "ChatGPT / Claude / Gemini / Poe", type: "Substitutes", evidence: "partial", pricing: "partial", workflow: "partial", stack: "no" },
    { name: "AIssessor", type: "Workflow decision layer", evidence: "partial", pricing: "yes", workflow: "yes", stack: "yes" },
  ];

  return (
    <div className="ref-financial-view">
      <div className="ref-financial-view-head">
        <div>
          <span className="ref-kicker">[ COMPETITIVE LANDSCAPE BENCHMARK ]</span>
          <h3>Compare the Job-to-be-Done — Not Incomparable Subscriptions</h3>
          <p>Capability assessment from official product pages; AIssessor row is the intended product thesis.</p>
        </div>
        <span className="ref-research-date">Researched 03 Sep 2026</span>
      </div>
      <div className="ref-competitor-matrix">
        <div className="ref-matrix-row ref-matrix-head">
          <span>Solution</span>
          <span>Source-linked evidence</span>
          <span>Current pricing data</span>
          <span>Brief → workflow</span>
          <span>Stack optimisation</span>
        </div>
        {rows.map((row) => (
          <div className={`ref-matrix-row ${row.name === "AIssessor" ? "is-aissessor" : ""}`} key={row.name}>
            <div>
              <strong>{row.name}</strong>
              <small>{row.type}</small>
            </div>
            <MatrixMark value={row.evidence} />
            <MatrixMark value={row.pricing} />
            <MatrixMark value={row.workflow} />
            <MatrixMark value={row.stack} />
          </div>
        ))}
      </div>
      <div className="ref-matrix-note">
        <b>Positioning Wedge</b>
        <span>
          Benchmarks answer “which model performs?” Directories answer “what tools exist?” AIssessor answers “which stack fits this workflow, budget, and policy—and what should change next month?”
        </span>
      </div>
      <SourceLinks />
    </div>
  );
}

function RegionalPlan({ selectedSom, currency }: { selectedSom: number; currency: Currency }) {
  const regions = [
    { name: "Southeast Asia", share: 40, color: "#0213B0", note: "Vietnam-first beachhead" },
    { name: "North America", share: 25, color: "#3559FF", note: "High SaaS willingness-to-pay" },
    { name: "Europe", share: 15, color: "#4F46E5", note: "Governance-led teams" },
    { name: "East Asia", share: 15, color: "#00A88F", note: "Dense AI-tool adoption" },
    { name: "Rest of world", share: 5, color: "#D97706", note: "Partner-led expansion" },
  ];

  return (
    <div className="ref-financial-view">
      <div className="ref-financial-view-head">
        <div>
          <span className="ref-kicker">[ GO-TO-MARKET ALLOCATION ]</span>
          <h3>Launch Focus by Geography</h3>
          <p>This is an editable planning narrative—not a claim about current regional market share.</p>
        </div>
        <span className="ref-assumption-pill">Planning assumption</span>
      </div>
      <div className="ref-regional-layout">
        <div className="ref-region-donut" aria-label="Go-to-market allocation donut chart">
          <div>
            <b>100%</b>
            <span>launch focus</span>
          </div>
        </div>
        <div className="ref-region-list">
          {regions.map((region) => (
            <div key={region.name}>
              <i style={{ background: region.color }} />
              <span>
                <strong>{region.name}</strong>
                <small>{region.note}</small>
              </span>
              <b>{region.share}%</b>
              <em>{marketMoney((selectedSom * region.share) / 100, currency)}</em>
            </div>
          ))}
        </div>
      </div>
      <div className="ref-matrix-note">
        <b>Why SEA First</b>
        <span>
          HCMC is the product and research base; the model prioritises a nearby feedback loop before higher-CAC expansion into North America and Europe.
        </span>
      </div>
    </div>
  );
}

function FinancialDiagnostics({
  ltv,
  payback,
  cac,
  margin,
  aiCost,
  monthlyRevenue,
  currency,
}: {
  ltv: number;
  payback: number;
  cac: number;
  margin: number;
  aiCost: number;
  monthlyRevenue: number;
  currency: Currency;
}) {
  const ratio = ltv / Math.max(cac, 1);
  const costShare = (aiCost / Math.max(monthlyRevenue, 0.01)) * 100;

  return (
    <div className="ref-financial-view">
      <div className="ref-financial-view-head">
        <div>
          <span className="ref-kicker">[ UNIT ECONOMICS & MARGIN DIAGNOSTICS ]</span>
          <h3>Separate Healthy-looking Revenue from Durable Growth</h3>
          <p>All outputs update with the selected case and monetisation assumptions.</p>
        </div>
        <span className="ref-assumption-pill">Operating assumptions</span>
      </div>
      <div className="ref-diagnostic-grid">
        <article className="tone-mint">
          <small>Gross margin</small>
          <b>{margin}%</b>
          <span>Target ≥ 75%</span>
        </article>
        <article className="tone-blue">
          <small>LTV / paying account</small>
          <b>{money(ltv, currency)}</b>
          <span>Margin-adjusted</span>
        </article>
        <article className="tone-indigo">
          <small>LTV : CAC</small>
          <b>{ratio.toFixed(1)}x</b>
          <span>Target ≥ 3.0x</span>
        </article>
        <article className="tone-blue">
          <small>CAC payback</small>
          <b>{payback.toFixed(1)} mo</b>
          <span>Target &lt; 12 months</span>
        </article>
      </div>
      <div className="ref-cost-diagnostic">
        <div>
          <BrainCircuit size={18} />
          <span>
            <strong>AI inference cost analysis</strong>
            <p>
              {money(aiCost, currency)} / payer / month equals approximately {costShare.toFixed(1)}% of modeled monthly revenue. Gross margin includes all modeled cost of revenue, not inference alone.
            </p>
          </span>
        </div>
        <div>
          <small>CAC</small>
          <b>{money(cac, currency)}</b>
        </div>
        <div>
          <small>Monthly revenue</small>
          <b>{money(monthlyRevenue, currency)}</b>
        </div>
      </div>
      <p className="ref-assumption">
        LTV = monthly ARPU × gross margin ÷ monthly churn. CAC payback = CAC ÷ monthly gross profit. Validate these assumptions with cohort data before investor use.
      </p>
    </div>
  );
}

function SourceLinks() {
  return (
    <div className="ref-source-links">
      <span>Primary research:</span>
      <a href="https://openrouter.ai/compare" target="_blank" rel="noreferrer">OpenRouter</a>
      <a href="https://artificialanalysis.ai/leaderboards/models" target="_blank" rel="noreferrer">Artificial Analysis</a>
      <a href="https://aimodelcomparison.org/" target="_blank" rel="noreferrer">AI Model Comparison</a>
      <a href="https://www.futurepedia.io/" target="_blank" rel="noreferrer">Futurepedia</a>
      <a href="https://www.toolify.ai/" target="_blank" rel="noreferrer">Toolify</a>
      <a href="https://help.poe.com/hc/en-us/articles/19945140063636-Poe-Purchases-FAQs" target="_blank" rel="noreferrer">Poe</a>
    </div>
  );
}

function MarketComparisonDeck({
  currency,
  setCurrency,
  starterPrice,
  optimisePrice,
  arpu,
  ltv,
  cac,
}: {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  starterPrice: number;
  optimisePrice: number;
  arpu: number;
  ltv: number;
  cac: number;
}) {
  type Category = "ours" | "direct" | "discovery" | "substitute";
  type ComparisonRow = {
    name: string;
    audience: string;
    category: Category;
    categoryLabel: string;
    commercial: string;
    evidence: number;
    pricing: "Current" | "Partial" | "Not structured";
    workflow: number;
    stack: number;
    governance: number;
    strength: string;
    gap: string;
    source: string;
  };

  const [filter, setFilter] = useState<"all" | Category>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const rows: ComparisonRow[] = [
    {
      name: "AIssessor",
      audience: "Individuals and teams choosing an AI workflow",
      category: "ours",
      categoryLabel: "Workflow decision layer",
      commercial: `${money(starterPrice, currency)} Starter · ${money(optimisePrice, currency)} Optimise · Team custom`,
      evidence: 4,
      pricing: "Current",
      workflow: 5,
      stack: 5,
      governance: 4,
      strength: "Brief-to-stack workflow, source trail, spend model, and recurring optimisation.",
      gap: "Product thesis still needs retention, savings, and recommendation-outcome validation.",
      source: "https://github.com/nguyen-ngoc-hong-minh/AIssessor",
    },
    {
      name: "OpenRouter",
      audience: "Developers selecting and routing foundation models",
      category: "direct",
      categoryLabel: "Model comparison & routing",
      commercial: "Free tier · pay-as-you-go · 5.5% platform fee",
      evidence: 5,
      pricing: "Current",
      workflow: 2,
      stack: 2,
      governance: 3,
      strength: "400+ models, unified API, live token prices, context, benchmarks, and routing controls.",
      gap: "Optimises model access—not a complete business tool stack or subscription portfolio.",
      source: "https://openrouter.ai/pricing",
    },
    {
      name: "Artificial Analysis",
      audience: "Technical evaluators and AI procurement teams",
      category: "direct",
      categoryLabel: "Independent benchmark data",
      commercial: "Free leaderboards · commercial data API",
      evidence: 5,
      pricing: "Current",
      workflow: 1,
      stack: 1,
      governance: 1,
      strength: "Independent intelligence, price, speed, latency, context, and provider measurements.",
      gap: "Evidence layer rather than a user brief, implementation roadmap, or optimisation workflow.",
      source: "https://artificialanalysis.ai/data-api",
    },
    {
      name: "AI Model Comparison",
      audience: "Researchers and builders comparing model families",
      category: "direct",
      categoryLabel: "Model comparison workspace",
      commercial: "Free tier · Premium comparison features",
      evidence: 4,
      pricing: "Current",
      workflow: 2,
      stack: 1,
      governance: 1,
      strength: "Source-linked metrics, AI selector, use-case context, and head-to-head model pages.",
      gap: "Primarily model-centric; does not optimise a multi-tool SaaS stack over time.",
      source: "https://aimodelcomparison.org/",
    },
    {
      name: "Futurepedia",
      audience: "Professionals discovering and learning AI tools",
      category: "discovery",
      categoryLabel: "Discovery & education",
      commercial: "Free directory · courses · affiliate-supported",
      evidence: 2,
      pricing: "Partial",
      workflow: 1,
      stack: 1,
      governance: 1,
      strength: "4,000+ curated tools plus education and a large professional audience.",
      gap: "Strong discovery on-ramp, but limited project-level decomposition and spend optimisation.",
      source: "https://www.futurepedia.io/",
    },
    {
      name: "Toolify",
      audience: "Users browsing tools by category, traffic, or region",
      category: "discovery",
      categoryLabel: "AI tools directory",
      commercial: "Free directory · advertising and listings",
      evidence: 2,
      pricing: "Partial",
      workflow: 1,
      stack: 1,
      governance: 1,
      strength: "Broad catalogue, category rankings, regional traffic views, and frequent additions.",
      gap: "Breadth can preserve choice overload; recommendations are not a governed decision workflow.",
      source: "https://www.toolify.ai/",
    },
    {
      name: "ChatGPT / Claude / Gemini",
      audience: "General consumers, professionals, and teams",
      category: "substitute",
      categoryLabel: "General AI assistants",
      commercial: "Freemium · individual and team subscriptions",
      evidence: 2,
      pricing: "Current",
      workflow: 3,
      stack: 2,
      governance: 4,
      strength: "Existing user habit, broad capability, projects, connectors, and enterprise controls.",
      gap: "A conversational recommendation is not automatically a maintained, source-linked stack decision.",
      source: "https://openai.com/chatgpt/pricing",
    },
    {
      name: "Poe",
      audience: "Users wanting many models under one interface",
      category: "substitute",
      categoryLabel: "Multi-model aggregator",
      commercial: "Free access · subscription · compute points",
      evidence: 2,
      pricing: "Current",
      workflow: 2,
      stack: 2,
      governance: 1,
      strength: "Many premium bots and media models under one subscription with unified access.",
      gap: "Reduces model-access friction, but does not audit external subscriptions or govern a tool stack.",
      source: "https://help.poe.com/hc/en-us/articles/19945140063636-Poe-Purchases-FAQs",
    },
  ];

  const filteredRows = rows.filter(
    (row) =>
      (filter === "all" || row.category === filter) &&
      `${row.name} ${row.audience} ${row.categoryLabel} ${row.strength} ${row.gap}`.toLowerCase().includes(query.toLowerCase())
  );

  const filters: { id: "all" | Category; label: string }[] = [
    { id: "all", label: `All Solutions (${rows.length})` },
    { id: "ours", label: "AIssessor" },
    { id: "direct", label: "Direct" },
    { id: "discovery", label: "Discovery" },
    { id: "substitute", label: "Substitutes" },
  ];

  const serialize = () =>
    filteredRows
      .map((row) =>
        [
          row.name,
          row.categoryLabel,
          row.commercial,
          `${row.evidence}/5`,
          row.pricing,
          `${row.workflow}/5`,
          `${row.stack}/5`,
          `${row.governance}/5`,
          row.strength,
          row.gap,
          row.source,
        ].join("\t")
      )
      .join("\n");

  async function copyData() {
    try {
      await navigator.clipboard.writeText(serialize());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function exportData() {
    const headings = [
      "Solution",
      "Category",
      "Commercial model",
      "Evidence quality",
      "Pricing freshness",
      "Workflow depth",
      "Stack optimisation",
      "Team governance",
      "Established strength",
      "Opening for AIssessor",
      "Source",
    ];
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const content = [
      headings,
      ...filteredRows.map((row) => [
        row.name,
        row.categoryLabel,
        row.commercial,
        `${row.evidence}/5`,
        row.pricing,
        `${row.workflow}/5`,
        `${row.stack}/5`,
        `${row.governance}/5`,
        row.strength,
        row.gap,
        row.source,
      ]),
    ]
      .map((line) => line.map(escape).join(","))
      .join("\n");

    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aissessor-competitor-matrix.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="ref-market-matrix">
      <div className="ref-market-head">
        <div className="ref-market-title">
          <span className="ref-market-icon">
            <BarChart3 size={20} />
          </span>
          <div>
            <div>
              <h2>Grounded Market Comparison Matrix</h2>
              <b>[ RESEARCHED 03 SEP 2026 ]</b>
            </div>
            <p>Capability-first benchmarking across model intelligence platforms, discovery directories, and substitutes.</p>
          </div>
        </div>
        <div className="ref-market-actions">
          <div className="ref-mini-currency">
            <span>Currency:</span>
            <button className={currency === "USD" ? "is-active" : ""} onClick={() => setCurrency("USD")}>
              $ USD
            </button>
            <button className={currency === "VND" ? "is-active" : ""} onClick={() => setCurrency("VND")}>
              ₫ VND
            </button>
          </div>
          <button className="ref-outline-button" onClick={copyData}>
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy data"}
          </button>
          <button className="ref-primary-button" onClick={exportData}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="ref-market-filterbar">
        <div className="ref-filter-group">
          <Layers3 size={14} />
          <span>[ FILTER: ]</span>
          {filters.map((item) => (
            <button
              key={item.id}
              className={filter === item.id ? "is-active" : ""}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="ref-search-box">
          <Search size={14} />
          <input
            aria-label="Search competitors"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search competitors or capabilities..."
          />
        </label>
      </div>

      <div className="ref-market-table-wrap">
        <div className="ref-market-table">
          <div className="ref-market-row ref-market-table-head">
            <span>Competitor / Solution</span>
            <span>Category</span>
            <span>Commercial Model</span>
            <span>Evidence</span>
            <span>Pricing</span>
            <span>Workflow</span>
            <span>Stack Opt.</span>
            <span>Governance</span>
            <span>Strategic Advantage & Opening</span>
          </div>
          {filteredRows.map((row) => (
            <div className={`ref-market-row ${row.category === "ours" ? "is-ours" : ""}`} key={row.name}>
              <div>
                <i />
                <span>
                  <a href={row.source} target="_blank" rel="noreferrer">
                    {row.name}
                  </a>
                  <small>{row.audience}</small>
                </span>
                {row.category === "ours" && <b>OUR APP</b>}
              </div>
              <span className={`ref-category-tag is-${row.category}`}>{row.categoryLabel}</span>
              <span className="ref-commercial-cell">{row.commercial}</span>
              <Score value={row.evidence} />
              <span className={`ref-pricing-status is-${row.pricing === "Current" ? "current" : row.pricing === "Partial" ? "partial" : "none"}`}>
                {row.pricing}
              </span>
              <Score value={row.workflow} />
              <Score value={row.stack} />
              <Score value={row.governance} />
              <div className="ref-advantage-cell">
                <p>
                  <Check size={12} /> {row.strength}
                </p>
                <p>
                  <CircleHelp size={12} /> {row.gap}
                </p>
              </div>
            </div>
          ))}
          {filteredRows.length === 0 && <div className="ref-market-empty">No competitors match this search.</div>}
        </div>
      </div>

      <div className="ref-market-takeaway">
        <div>
          <Zap size={17} />
          <span>
            <strong>[ INVESTOR TAKEAWAY ]</strong>
            <p>
              AIssessor should not claim “better AI recommendations.” Its defensible wedge is the maintained evidence trail from business brief → tool stack → cost → outcome → recurring optimisation.
            </p>
          </span>
        </div>
        <div>
          <small>Modeled ARPU</small>
          <b>{money(arpu, currency)} / yr</b>
        </div>
        <div>
          <small>Target LTV : CAC</small>
          <b>{(ltv / Math.max(cac, 1)).toFixed(1)}x</b>
        </div>
      </div>
    </section>
  );
}

function Score({ value }: { value: number }) {
  return <span className={`ref-score is-${value >= 4 ? "high" : value >= 3 ? "mid" : "low"}`}>{value} / 5</span>;
}

function StrategySlide({
  currency,
  teamSize,
  setTeamSize,
  salary,
  setSalary,
  hcmcOpex,
}: {
  currency: Currency;
  teamSize: number;
  setTeamSize: (value: number) => void;
  salary: number;
  setSalary: (value: number) => void;
  hcmcOpex: number;
}) {
  const usSalaryBenchmark = 140_000;
  const usTeamCost = teamSize * usSalaryBenchmark;
  const annualSaving = Math.max(usTeamCost - hcmcOpex, 0);
  const runwayMultiplier = usTeamCost / Math.max(hcmcOpex, 1);
  const funding = 500_000;
  const hcmcRunway = (funding / Math.max(hcmcOpex, 1)) * 12;
  const usRunway = (funding / Math.max(usTeamCost, 1)) * 12;

  const mechanics = [
    {
      icon: <Workflow size={17} />,
      title: "Structured Brief Decomposition",
      copy: "Convert goals, budget, skills, privacy, and integration constraints into a reusable decision specification.",
    },
    {
      icon: <BrainCircuit size={17} />,
      title: "Evidence-Ranked Shortlist",
      copy: "Join current pricing, model benchmarks, tool capabilities, and source freshness before recommending a stack.",
    },
    {
      icon: <WalletCards size={17} />,
      title: "Cost & Subscription Optimiser",
      copy: "Compare overlapping tools, usage limits, switching costs, and savings—not only model quality.",
    },
    {
      icon: <TrendingUp size={17} />,
      title: "Outcome Feedback Loop",
      copy: "Track selections, realised savings, satisfaction, and workflow outcomes to improve future recommendations.",
    },
  ];

  return (
    <div className="ref-slide ref-strategy-slide">
      <div className="ref-slide-title">
        <div>
          <span className="ref-kicker">
            <Sparkles size={13} /> [ SLIDE 06 · AI MOAT & HCMC STRATEGY ]
          </span>
          <h2>Compound decision intelligence with a capital-efficient build hub.</h2>
          <p>The product moat comes from structured outcomes; the operating advantage comes from a focused Vietnam-first team.</p>
        </div>
        <div className="ref-slide-number">[ Slide 06 of 06 ]</div>
      </div>

      <div className="ref-strategy-layout">
        <section className="ref-moat-panel">
          <div className="ref-strategy-panel-head">
            <span><Layers3 size={19} /></span>
            <div>
              <h3>Compounding AI Decision Mechanics</h3>
              <p>How every completed strategy improves trust, retention, and recommendation quality.</p>
            </div>
          </div>
          <div className="ref-mechanics-grid">
            {mechanics.map((item) => (
              <article key={item.title}>
                <span>{item.icon}</span>
                <h4>{item.title}</h4>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
          <div className="ref-moat-loop">
            <Target size={17} />
            <span>
              <strong>[ DEFENSIBILITY LOOP ]</strong>
              <p>
                More briefs → more verified decisions → better fit signals → higher trust → more repeat workflows. This must be measured through outcomes, not claimed from recommendation volume alone.
              </p>
            </span>
          </div>
        </section>

        <section className="ref-hcmc-panel">
          <div className="ref-strategy-panel-head">
            <span><Pin size={19} /></span>
            <div>
              <h3>Ho Chi Minh City Capital Efficiency</h3>
              <p>Salary-only engineering capacity model versus a US benchmark.</p>
            </div>
            <b>{runwayMultiplier.toFixed(1)}x runway</b>
          </div>
          <div className="ref-team-cost-grid">
            <article>
              <small>US team benchmark</small>
              <b>{money(usTeamCost, currency)} / yr</b>
              <span>{teamSize} people × {money(usSalaryBenchmark, currency)}</span>
            </article>
            <article>
              <small>HCMC team model</small>
              <b>{money(hcmcOpex, currency)} / yr</b>
              <span>{teamSize} people × {money(salary, currency)}</span>
            </article>
          </div>
          <div className="ref-savings-card">
            <div>
              <span>Annual salary-base capital saved</span>
              <b>+{money(annualSaving, currency)}</b>
            </div>
            <i>
              <em style={{ width: `${Math.min((hcmcOpex / Math.max(usTeamCost, 1)) * 100, 100)}%` }} />
            </i>
            <p>
              A {money(funding, currency, true)} pre-seed funds approximately <strong>{hcmcRunway.toFixed(0)} months</strong> of modeled HCMC salaries versus <strong>{usRunway.toFixed(0)} months</strong> at the US benchmark.
            </p>
          </div>
          <div className="ref-strategy-controls">
            <label>
              <span>Initial product & research team <b>{teamSize} people</b></span>
              <input
                aria-label="Initial product and research team size"
                type="range"
                min="2"
                max="20"
                value={teamSize}
                onChange={(event) => setTeamSize(Number(event.target.value))}
              />
            </label>
            <label>
              <span>HCMC annual salary assumption <b>{money(salary, currency)}</b></span>
              <input
                aria-label="HCMC annual salary assumption"
                type="range"
                min="10000"
                max="100000"
                step="1000"
                value={salary}
                onChange={(event) => setSalary(Number(event.target.value))}
              />
            </label>
          </div>
          <p className="ref-strategy-caveat">
            <CircleHelp size={13} /> Planning model only. Comparison excludes benefits, taxes, recruiting, office, cloud, sales, and legal costs; replace with validated hiring quotes before fundraising.
          </p>
        </section>
      </div>

      <div className="ref-execution-roadmap">
        <div>
          <span>[ 0–6 MONTHS ]</span>
          <b>Validate Decision Quality</b>
          <p>Prove users complete recommendations and report measurable fit or savings.</p>
        </div>
        <i />
        <div>
          <span>[ 6–12 MONTHS ]</span>
          <b>Build the Evidence Graph</b>
          <p>Automate pricing freshness, benchmark provenance, and outcome collection.</p>
        </div>
        <i />
        <div>
          <span>[ 12–18 MONTHS ]</span>
          <b>Expand Team Governance</b>
          <p>Add approvals, spend policies, shared stacks, and recurring optimisation.</p>
        </div>
      </div>
    </div>
  );
}
