"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFollowup, deleteFollowup } from "@/lib/actions/followups";
import { FOLLOWUP_CHANNELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type Followup = {
  id: string;
  date: Date | string;
  channel: string;
  notes: string;
  nextDate: Date | string | null;
  author: { id: string; name: string } | null;
};

type OptimisticFollowup = Followup & { pending?: boolean };

const CHANNEL_STYLES: Record<string, string> = {
  Call: "border-brand-200 bg-brand-50 text-brand-700",
  WhatsApp: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Email: "border-sky-200 bg-sky-50 text-sky-700",
  Meeting: "border-violet-200 bg-violet-50 text-violet-700",
  SMS: "border-amber-200 bg-amber-50 text-amber-700",
  Other: "border-stone-200 bg-stone-100 text-stone-600",
};

export default function FollowupsSection({
  leadId,
  followups,
  currentUser,
}: {
  leadId: string;
  followups: Followup[];
  currentUser: { id: string; name: string; role: "ADMIN" | "MEMBER" };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const [optimistic, addOptimistic] = useOptimistic<
    OptimisticFollowup[],
    OptimisticFollowup
  >(followups, (state, item) =>
    [item, ...state].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  function handleSubmit(formData: FormData) {
    const notes = (formData.get("notes") as string)?.trim();
    const date = formData.get("date") as string;
    if (!notes) return setError("Describe the follow-up.");
    if (!date) return setError("Pick a date.");
    setError(null);

    const channel = (formData.get("channel") as string) || "Call";
    const nextDate = (formData.get("nextDate") as string) || null;
    formRef.current?.reset();

    startTransition(async () => {
      addOptimistic({
        id: `optimistic-${Date.now()}`,
        date,
        channel,
        notes,
        nextDate,
        author: { id: currentUser.id, name: currentUser.name },
        pending: true,
      });
      const res = await addFollowup({}, formData);
      if (res?.error) setError(res.error);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteFollowup({}, fd);
      router.refresh();
    });
  }

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-stone-900">
        Follow-ups
        <span className="ml-2 text-stone-400">{optimistic.length}</span>
      </h2>

      <form ref={formRef} action={handleSubmit} className="mt-4 space-y-3">
        <input type="hidden" name="leadId" value={leadId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="fu-date">Follow-up date</label>
            <input
              id="fu-date"
              name="date"
              type="date"
              defaultValue={today}
              max={today}
              className="input cursor-pointer"
            />
          </div>
          <div>
            <label className="label" htmlFor="fu-channel">Channel</label>
            <select id="fu-channel" name="channel" defaultValue="Call" className="input cursor-pointer">
              {FOLLOWUP_CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="fu-notes">What was the follow-up?</label>
          <textarea
            id="fu-notes"
            name="notes"
            rows={2}
            placeholder="e.g. Called to discuss the proposal — client wants a revised quote by Friday."
            className="input resize-none"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="sm:w-1/2">
            <label className="label" htmlFor="fu-next">Next follow-up (optional)</label>
            <input
              id="fu-next"
              name="nextDate"
              type="date"
              min={today}
              className="input cursor-pointer"
            />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary shrink-0">
            {isPending ? "Logging…" : "Log follow-up"}
          </button>
        </div>
        {error && <p className="text-xs text-rose-700">{error}</p>}
      </form>

      <div className="mt-6 space-y-3">
        {optimistic.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">
            No follow-ups logged yet.
          </p>
        ) : (
          optimistic.map((f) => {
            const canDelete =
              !f.pending &&
              (currentUser.role === "ADMIN" || f.author?.id === currentUser.id);
            return (
              <div
                key={f.id}
                className={`rounded-xl border border-line bg-stone-50 p-4 transition-opacity ${
                  f.pending ? "opacity-60" : "opacity-100"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium text-stone-900">
                    {formatDate(f.date)}
                  </span>
                  <span
                    className={`badge ${CHANNEL_STYLES[f.channel] ?? CHANNEL_STYLES.Other}`}
                  >
                    {f.channel}
                  </span>
                  {f.nextDate && (
                    <span className="badge border-brand-200 bg-brand-50 text-brand-700">
                      Next: {formatDate(f.nextDate)}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-2 text-xs text-stone-400">
                    {f.author?.name ?? "Removed member"}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    )}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700">
                  {f.notes}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
