"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { OnboardingInitial } from "./onboarding-form";

export function SettingsView({ profile }: { profile: OnboardingInitial }) {
  const { user } = useUser();

  const initialFirstName = user?.firstName || "Hồng Minh";
  const initialLastName = user?.lastName || "Russell";
  const initialEmail = user?.primaryEmailAddress?.emailAddress || "nguyenminh.slays@gmail.com";
  const avatarUrl = user?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings-editorial-wrap w-full max-w-4xl mx-auto space-y-8 py-4 my-auto">
      {/* Main Page Title */}
      <div className="editorial-page-header mb-8">
        <h1 className="text-4xl md:text-5xl font-semibold text-ink tracking-tight">
          Account &amp; Security
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Block 1: Profile Picture */}
        <section className="settings-faint-block">
          <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
            Profile Picture
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <img
              src={avatarUrl}
              alt="Profile Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/40 shadow-xl flex-none"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-primary text-xs px-6 py-3 rounded-full"
              >
                Upload Image
              </button>
              <button
                type="button"
                className="btn-secondary text-xs px-6 py-3 rounded-full"
              >
                Remove
              </button>
            </div>
          </div>
        </section>

        {/* Block 2: Personal Details */}
        <section className="settings-faint-block">
          <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
            Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <label className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="styled-input pill-input py-3.5"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="styled-input pill-input py-3.5"
                placeholder="Last name"
              />
            </div>
          </div>
        </section>

        {/* Block 3: Email Address */}
        <section className="settings-faint-block">
          <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
            Login Email
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="styled-input pill-input py-3.5 flex-1"
              placeholder="email@example.com"
            />
            <button
              type="button"
              className="btn-secondary text-xs px-6 py-3 rounded-full flex-none"
            >
              Edit Email
            </button>
          </div>
        </section>

        {/* Block 4: Password & Security */}
        <section className="settings-faint-block">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="settings-section-title text-xl font-semibold text-ink font-sans !pb-0">
              Password &amp; Authentication
            </h2>
            <button
              type="button"
              className="btn-secondary text-xs px-6 py-3 rounded-full flex-none self-start sm:self-center"
            >
              Change Password
            </button>
          </div>
        </section>

        {/* Spacer Div */}
        <div className="h-[30px] w-full block" style={{ height: "30px", minHeight: "30px" }} />

        {/* Form Actions Footer */}
        <div className="flex items-center justify-end gap-4 pt-4">
          {saved && (
            <span className="text-sm text-emerald-400 font-medium mr-auto">
              Settings saved successfully!
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setFirstName(initialFirstName);
              setLastName(initialLastName);
              setEmail(initialEmail);
            }}
            className="btn-secondary text-xs px-6 py-3 rounded-full"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary text-xs px-8 py-3 rounded-full shadow-lg shadow-indigo-600/30"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
