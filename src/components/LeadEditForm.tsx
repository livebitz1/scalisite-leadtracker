"use client";

import { useActionState, useEffect, useState } from "react";
import { updateLead, type ActionState } from "@/lib/actions/leads";
import { LEAD_SOURCES, LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  source: string;
  status: (typeof LEAD_STATUSES)[number];
  value: number | null;
};

export default function LeadEditForm({ lead }: { lead: Lead }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateLead,
    {}
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form action={formAction} className="card p-6">
      <input type="hidden" name="id" value={lead.id} />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Lead details</h2>
        {saved && (
          <span className="text-xs text-emerald-300/90">Saved ✓</span>
        )}
        {state.error && (
          <span className="text-xs text-rose-300">{state.error}</span>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name *</label>
          <input id="name" name="name" required defaultValue={lead.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="company">Company</label>
          <input id="company" name="company" defaultValue={lead.company ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required defaultValue={lead.email} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone *</label>
          <input id="phone" name="phone" required defaultValue={lead.phone} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="source">Source *</label>
          <select id="source" name="source" defaultValue={lead.source} className="input cursor-pointer">
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            {!LEAD_SOURCES.includes(lead.source) && (
              <option value={lead.source}>{lead.source}</option>
            )}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">Status *</label>
          <select id="status" name="status" defaultValue={lead.status} className="input cursor-pointer">
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="value">Estimated value (INR)</label>
          <input id="value" name="value" type="number" min="0" step="100" defaultValue={lead.value ?? ""} className="input" />
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
