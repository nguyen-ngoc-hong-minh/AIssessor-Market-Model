"use client";

export type OptionalDetailsValue = {
  informationSensitivity: string;
  preferredLanguage: string;
  existingTools: string;
  providersToAvoid: string;
  expectedOutputs: string;
  commercialUse: boolean;
};

export const defaultOptionalDetails: OptionalDetailsValue = {
  informationSensitivity: "standard",
  preferredLanguage: "English",
  existingTools: "",
  providersToAvoid: "",
  expectedOutputs: "",
  commercialUse: true,
};

export function OptionalDetails({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: OptionalDetailsValue;
  onChange(value: OptionalDetailsValue): void;
}) {
  function update(patch: Partial<OptionalDetailsValue>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-2">
      <p className="md:col-span-2 text-xs text-ink-2 leading-relaxed !p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/20">
        Every answer below changes model eligibility, total cost, or ranking. Add as much detail as possible for a more accurate plan.
      </p>

      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-sensitivity`}
          className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider block"
        >
          Information sensitivity
        </label>
        <select
          id={`${idPrefix}-sensitivity`}
          className="styled-input pill-input py-3.5 w-full bg-[#131626] border border-white/10 text-white text-xs rounded-full px-4 focus:border-indigo-500 outline-none"
          value={value.informationSensitivity}
          onChange={(event) =>
            update({ informationSensitivity: event.target.value })
          }
        >
          <option value="standard">Standard work</option>
          <option value="business">Confidential business</option>
          <option value="sensitive">Sensitive information</option>
          <option value="restricted">Restricted or regulated</option>
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-language`}
          className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider block"
        >
          Preferred language
        </label>
        <input
          id={`${idPrefix}-language`}
          className="styled-input pill-input py-3.5 w-full text-xs"
          value={value.preferredLanguage}
          onChange={(event) =>
            update({ preferredLanguage: event.target.value })
          }
          placeholder="e.g. English, Vietnamese"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-tools`}
          className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider block"
        >
          Tools already owned
        </label>
        <input
          id={`${idPrefix}-tools`}
          className="styled-input pill-input py-3.5 w-full text-xs"
          value={value.existingTools}
          onChange={(event) => update({ existingTools: event.target.value })}
          placeholder="Comma-separated (e.g. ChatGPT, Canva)"
        />
        <p className="text-[11px] text-ink-3">Owned subscriptions are treated as no additional monthly cost.</p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-providers`}
          className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider block"
        >
          Providers to avoid
        </label>
        <input
          id={`${idPrefix}-providers`}
          className="styled-input pill-input py-3.5 w-full text-xs"
          value={value.providersToAvoid}
          onChange={(event) =>
            update({ providersToAvoid: event.target.value })
          }
          placeholder="Comma-separated (e.g. OpenAI, Anthropic)"
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <label
          htmlFor={`${idPrefix}-outputs`}
          className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider block"
        >
          Expected output details
        </label>
        <input
          id={`${idPrefix}-outputs`}
          className="styled-input pill-input py-3.5 w-full text-xs"
          value={value.expectedOutputs}
          onChange={(event) =>
            update({ expectedOutputs: event.target.value })
          }
          placeholder="Quantities, file formats, dimensions, or delivery requirements"
        />
      </div>

      <div className="md:col-span-2 pt-2 flex items-center gap-3">
        <input
          type="checkbox"
          id={`${idPrefix}-commercial`}
          className="w-4 h-4 rounded-full appearance-none border-2 border-indigo-500/40 checked:bg-indigo-500 checked:border-indigo-500 relative cursor-pointer"
          checked={value.commercialUse}
          onChange={(event) => update({ commercialUse: event.target.checked })}
        />
        <label
          htmlFor={`${idPrefix}-commercial`}
          className="text-xs font-medium text-white cursor-pointer select-none"
        >
          Commercial use required
        </label>
      </div>
    </div>
  );
}
