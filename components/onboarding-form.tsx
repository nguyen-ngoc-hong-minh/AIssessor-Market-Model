"use client";

import { Building2, UserRound, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AccountType = "individual" | "team" | "enterprise";
export type OnboardingInitial = { accountType?: AccountType; profession?: string; industry?: string; teamSize?: string; companySize?: string; departments?: string[]; country?: string; preferredLanguage?: string };
const professions = ["Student or academic", "Creative and media", "Marketing and communications", "Software and technology", "Research and analysis", "Business and administration", "Independent business", "Other"];
const industries = ["Technology", "Professional services", "Financial services", "Healthcare", "Retail", "Manufacturing", "Education", "Media", "Other"];
const countries = ["Vietnam", "Australia", "Singapore", "United States", "United Kingdom", "Other"];
const languages = ["English", "Vietnamese", "Chinese", "Spanish", "French", "Other"];
const departmentOptions = ["Marketing", "Sales", "Product", "Engineering", "Operations", "Finance", "People and HR", "Customer support"];

export function OnboardingForm({ initial = {}, mode = "onboarding" }: { initial?: OnboardingInitial; mode?: "onboarding" | "settings" }) {
  const router = useRouter(); const [type, setType] = useState<AccountType>(initial.accountType ?? "individual");
  const [profession, setProfession] = useState(initial.profession ?? ""); const [industry, setIndustry] = useState(initial.industry ?? "");
  const [teamSize, setTeamSize] = useState(initial.teamSize ?? ""); const [companySize, setCompanySize] = useState(initial.companySize ?? "");
  const [departments, setDepartments] = useState<string[]>(initial.departments ?? []); const [country, setCountry] = useState(initial.country ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(initial.preferredLanguage ?? "English"); const [error, setError] = useState("");
  const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  function choose(next: AccountType) { setType(next); setProfession(""); setTeamSize(""); setCompanySize(""); setDepartments([]); setError(""); }
  function toggleDepartment(value: string) { setDepartments((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSaved(false);
    const payload = type === "individual" ? { accountType: type, profession, industry, country, preferredLanguage }
      : type === "team" ? { accountType: type, profession, industry, teamSize, country, preferredLanguage }
      : { accountType: type, industry, companySize, departments, country, preferredLanguage };
    setBusy(true);
    try {
      const response = await fetch("/api/onboarding", { method: mode === "settings" ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to save profile");
      if (mode === "settings") setSaved(true); else router.push("/choose-usage");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save profile"); } finally { setBusy(false); }
  }
  return <><div className="option-grid stakeholder-options">{([{ id: "individual", title: "Individual", text: "Optimize work for yourself.", icon: UserRound }, { id: "team", title: "Team", text: "Plan shared work for a team.", icon: UsersRound }, { id: "enterprise", title: "Enterprise", text: "Coordinate AI across departments.", icon: Building2 }] as const).map(({ id, title, text, icon: Icon }) => <button type="button" className={`option-card ${type === id ? "selected" : ""}`} onClick={() => choose(id)} key={id}><Icon /><h3>{title}</h3><p>{text}</p></button>)}</div><form className="card three-questions stakeholder-form" onSubmit={submit}><div className="form-grid">{type !== "enterprise" && <div className="field"><label>{type === "team" ? "Profession / role" : "Profession"}</label><select value={profession} onChange={(event) => setProfession(event.target.value)} required><option value="">Choose one</option>{professions.map((item) => <option key={item}>{item}</option>)}</select></div>}<div className="field"><label>Industry</label><select value={industry} onChange={(event) => setIndustry(event.target.value)} required><option value="">Choose one</option>{industries.map((item) => <option key={item}>{item}</option>)}</select></div>{type === "team" && <div className="field"><label>Team size</label><select value={teamSize} onChange={(event) => setTeamSize(event.target.value)} required><option value="">Choose one</option>{["2–5", "6–15", "16–50", "51–200", "More than 200"].map((item) => <option key={item}>{item}</option>)}</select></div>}{type === "enterprise" && <><div className="field"><label>Company size</label><select value={companySize} onChange={(event) => setCompanySize(event.target.value)} required><option value="">Choose one</option>{["50–249", "250–999", "1,000–4,999", "5,000 or more"].map((item) => <option key={item}>{item}</option>)}</select></div><fieldset className="field full department-field"><legend>Departments using AI</legend><div>{departmentOptions.map((item) => <label className={departments.includes(item) ? "selected" : ""} key={item}><input type="checkbox" checked={departments.includes(item)} onChange={() => toggleDepartment(item)} />{item}</label>)}</div></fieldset></>}<div className="field"><label>Country</label><select value={country} onChange={(event) => setCountry(event.target.value)} required><option value="">Choose one</option>{countries.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label>Preferred language</label><select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} required>{languages.map((item) => <option key={item}>{item}</option>)}</select></div></div>{error && <p className="error-message">{error}</p>}{saved && <p className="success-message">Profile updated.</p>}<div className="form-actions"><button className="button button-primary" disabled={busy || (type === "enterprise" && departments.length === 0)}>{busy ? "Saving…" : mode === "settings" ? "Save profile" : "Continue"}</button></div></form></>;
}
