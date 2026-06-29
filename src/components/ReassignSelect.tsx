"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { reassignLead, type ActionState } from "@/lib/actions/leads";

type Member = { id: string; name: string };

export default function ReassignSelect({
  leadId,
  currentAssigneeId,
  members,
}: {
  leadId: string;
  currentAssigneeId: string;
  members: Member[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    reassignLead,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="id" value={leadId} />
      <div className="flex items-center justify-between">
        <label className="label mb-0" htmlFor="assignedToId">
          Assigned member
        </label>
        {pending && <span className="text-xs text-white/40">Saving…</span>}
        {saved && <span className="text-xs text-emerald-300/90">Updated ✓</span>}
      </div>
      <select
        id="assignedToId"
        name="assignedToId"
        defaultValue={currentAssigneeId}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className="input mt-1.5 cursor-pointer"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      {state.error && (
        <p className="mt-1.5 text-xs text-rose-300">{state.error}</p>
      )}
    </form>
  );
}
