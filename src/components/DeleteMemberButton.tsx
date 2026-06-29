"use client";

import { useActionState } from "react";
import { deleteMember, type ActionState } from "@/lib/actions/users";

export default function DeleteMemberButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteMember,
    {}
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
      className="text-right"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-rose-300/80 transition hover:text-rose-300 disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error && (
        <p className="mt-1 max-w-[220px] text-xs text-rose-300/80">
          {state.error}
        </p>
      )}
    </form>
  );
}
