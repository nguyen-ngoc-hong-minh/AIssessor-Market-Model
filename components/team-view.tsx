"use client";

import { ArrowUpRight, Plus, UsersRound, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { IntegrationNotice } from "./integration-notice";
import { integrationsConfigured } from "./providers";

type TeamEntry = {
  team: { _id: string; name: string } | null;
  membership: { role: string };
};

export function TeamView() {
  const [items, setItems] = useState<TeamEntry[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/teams")
      .then(async (r) => {
        const b = (await r.json()) as TeamEntry[] | { error?: string };
        if (!r.ok) throw new Error("error" in b ? b.error : "Unable to load teams");
        return b as TeamEntry[];
      })
      .then(setItems)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (integrationsConfigured) load();
  }, []);

  async function create() {
    setError("");
    const r = await fetch("/api/teams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const b = (await r.json()) as { error?: string };
    if (!r.ok) {
      setError(b.error ?? "Unable to create team");
      return;
    }
    setName("");
    load();
  }

  if (!integrationsConfigured) return <IntegrationNotice />;

  return (
    <div className="team-editorial-wrap">
      {/* Header */}
      <div className="editorial-page-header">
        <span className="mono-badge">[ WORKSPACE / TEAM ]</span>
        <h1>Shared Workspace &amp; Collaboration</h1>
        <p>Collaborate on AI strategy plans, share benchmark recommendations, and manage team permissions.</p>
      </div>

      {/* Main Team Card */}
      <div className="editorial-card-block">
        <div className="card-block-top">
          <div className="team-icon-wrap">
            <UsersRound className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2>Create New Team Workspace</h2>
            <p>Requires an active Team plan subscription verified by Stripe.</p>
          </div>
        </div>

        <div className="team-form-row">
          <div className="styled-field flex-1">
            <label htmlFor="team-name-input">Team Name</label>
            <input
              id="team-name-input"
              className="styled-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Studio Engineering Team"
            />
          </div>
          <button className="minimal-btn minimal-btn-dark" onClick={create}>
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>

        {error && <p className="error-message mt-4">{error}</p>}

        {/* Existing Teams Table */}
        <div className="teams-list-wrap mt-8">
          <h3>Your Team Workspaces ({items.length})</h3>

          {items.length === 0 ? (
            <p className="subtle-text">No active team workspaces found. Create one above to get started.</p>
          ) : (
            <div className="teams-table-list">
              {items.map((item) => (
                <div className="team-row-card" key={item.team?._id}>
                  <div className="team-info">
                    <strong>{item.team?.name}</strong>
                    <div className="team-role-tag">
                      <Shield className="w-3 h-3 text-black" />
                      <span>Role: {item.membership.role}</span>
                    </div>
                  </div>
                  <span className="badge-tag">ACTIVE WORKSPACE</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
