"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addNote } from "@/lib/actions/leads";
import { initials, timeAgo } from "@/lib/format";

type Role = "ADMIN" | "MEMBER";

type Note = {
  id: string;
  content: string;
  createdAt: Date | string;
  author: { name: string; role: Role } | null;
};

type OptimisticNote = Note & { pending?: boolean };

export default function NotesSection({
  leadId,
  notes,
  currentUser,
}: {
  leadId: string;
  notes: Note[];
  currentUser: { name: string; role: Role };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticNotes, addOptimistic] = useOptimistic<OptimisticNote[], string>(
    notes,
    (state, content) => [
      {
        id: `optimistic-${Date.now()}`,
        content,
        createdAt: new Date(),
        author: { name: currentUser.name, role: currentUser.role },
        pending: true,
      },
      ...state,
    ]
  );

  function handleSubmit(formData: FormData) {
    const content = (formData.get("content") as string)?.trim();
    if (!content) {
      setError("Note cannot be empty.");
      return;
    }
    setError(null);
    formRef.current?.reset();

    startTransition(async () => {
      addOptimistic(content);
      const res = await addNote({}, formData);
      if (res?.error) {
        setError(res.error);
      }
      // Reconcile with the server (replaces the optimistic note with the real one).
      router.refresh();
    });
  }

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-stone-900">
        Notes
        <span className="ml-2 text-stone-400">{optimisticNotes.length}</span>
      </h2>

      <form ref={formRef} action={handleSubmit} className="mt-4">
        <input type="hidden" name="leadId" value={leadId} />
        <textarea
          name="content"
          required
          rows={3}
          placeholder="Add a note about this lead…"
          className="input resize-none"
        />
        {error && <p className="mt-1.5 text-xs text-rose-700">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? "Adding…" : "Add note"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {optimisticNotes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">
            No notes yet. Add the first one above.
          </p>
        ) : (
          optimisticNotes.map((note) => (
            <div
              key={note.id}
              className={`rounded-xl border border-line bg-stone-50 p-4 transition-opacity ${
                note.pending ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 text-[10px] font-semibold text-stone-600">
                  {note.author ? initials(note.author.name) : "—"}
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {note.author?.name ?? "Removed member"}
                </span>
                <span
                  className={`badge ${
                    !note.author
                      ? "border-stone-200 bg-stone-50 text-stone-400"
                      : note.author.role === "ADMIN"
                        ? "border-stone-300 bg-stone-100 text-stone-600"
                        : "border-sky-200 bg-sky-50 text-sky-700"
                  }`}
                >
                  {!note.author
                    ? "Removed"
                    : note.author.role === "ADMIN"
                      ? "Admin"
                      : "Member"}
                </span>
                <span className="ml-auto text-xs text-stone-400">
                  {note.pending ? "Saving…" : timeAgo(note.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
