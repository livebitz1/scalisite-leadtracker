"use client";

import { useActionState } from "react";
import { createLead, type ActionState } from "@/lib/actions/leads";
import { LEAD_SOURCES, LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";

type Member = { id: string; name: string };

export default function AddLeadForm({
  isAdmin,
  currentUserId,
  members,
}: {
  isAdmin: boolean;
  currentUserId: string;
  members: Member[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createLead,
    {}
  );

  return (
    <form action={formAction} className="card p-6">
      {state.error && (
        <div className="mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name *</label>
          <input id="name" name="name" required className="input" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label" htmlFor="company">Company</label>
          <input id="company" name="company" className="input" placeholder="Acme Inc." />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required className="input" placeholder="jane@acme.com" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone *</label>
          <input id="phone" name="phone" required className="input" placeholder="+1 555 123 4567" />
        </div>
        <div>
          <label className="label" htmlFor="source">Source *</label>
          <select id="source" name="source" required defaultValue="Website" className="input cursor-pointer">
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="NEW" className="input cursor-pointer">
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="value">Estimated value (INR)</label>
          <input id="value" name="value" type="number" min="0" step="100" className="input" placeholder="5000" />
        </div>
        {isAdmin && (
          <div>
            <label className="label" htmlFor="assignedToId">Assign to</label>
            <select
              id="assignedToId"
              name="assignedToId"
              defaultValue={currentUserId}
              className="input cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <SubmitButton pendingText="Creating…">Create lead</SubmitButton>
        <a href="/leads" className="btn-ghost">Cancel</a>
      </div>
    </form>
  );
}
