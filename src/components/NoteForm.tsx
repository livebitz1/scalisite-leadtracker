"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addNote, type ActionState } from "@/lib/actions/leads";
import SubmitButton from "@/components/SubmitButton";

export default function NoteForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(addNote, {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      // Refetch server components so the new note appears immediately.
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="mt-4">
      <input type="hidden" name="leadId" value={leadId} />
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Add a note about this lead…"
        className="input resize-none"
      />
      {state.error && (
        <p className="mt-1.5 text-xs text-rose-300">{state.error}</p>
      )}
      <div className="mt-3 flex justify-end">
        <SubmitButton pendingText="Adding…">Add note</SubmitButton>
      </div>
    </form>
  );
}
