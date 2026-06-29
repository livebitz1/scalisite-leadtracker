"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMember, type ActionState } from "@/lib/actions/users";
import SubmitButton from "@/components/SubmitButton";

export default function CreateMemberForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createMember,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="card p-6">
      <h2 className="mb-5 text-sm font-semibold text-white">Add team member</h2>

      {state.error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Member created successfully.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-name">Name</label>
          <input id="m-name" name="name" required className="input" placeholder="Alex Rivera" />
        </div>
        <div>
          <label className="label" htmlFor="m-email">Email</label>
          <input id="m-email" name="email" type="email" required className="input" placeholder="alex@scalisite.com" />
        </div>
        <div>
          <label className="label" htmlFor="m-password">Temporary password</label>
          <input id="m-password" name="password" type="text" required minLength={8} className="input" placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="label" htmlFor="m-role">Role</label>
          <select id="m-role" name="role" defaultValue="MEMBER" className="input cursor-pointer">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton pendingText="Creating…">Create member</SubmitButton>
      </div>
    </form>
  );
}
