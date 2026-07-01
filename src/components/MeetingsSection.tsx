"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMeeting, deleteMeeting } from "@/lib/actions/meetings";
import { formatDateTime } from "@/lib/format";

type Meeting = {
  id: string;
  date: Date | string;
  title: string;
  location: string | null;
  author: { id: string; name: string } | null;
};

type OptimisticMeeting = Meeting & { pending?: boolean };

export default function MeetingsSection({
  leadId,
  meetings,
  currentUser,
}: {
  leadId: string;
  meetings: Meeting[];
  currentUser: { id: string; name: string; role: "ADMIN" | "MEMBER" };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimistic, addOptimistic] = useOptimistic<
    OptimisticMeeting[],
    OptimisticMeeting
  >(meetings, (state, item) => [...state, item]);

  const now = Date.now();
  const sorted = [...optimistic].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const upcoming = sorted.filter((m) => new Date(m.date).getTime() >= now);
  const past = sorted
    .filter((m) => new Date(m.date).getTime() < now)
    .reverse();

  function handleSubmit(formData: FormData) {
    const title = (formData.get("title") as string)?.trim();
    const date = formData.get("date") as string;
    if (!date) return setError("Pick a date & time.");
    if (!title) return setError("Add what the meeting is about.");
    setError(null);
    const location = (formData.get("location") as string) || null;
    formRef.current?.reset();

    startTransition(async () => {
      addOptimistic({
        id: `optimistic-${Date.now()}`,
        date,
        title,
        location,
        author: { id: currentUser.id, name: currentUser.name },
        pending: true,
      });
      const res = await addMeeting({}, formData);
      if (res?.error) setError(res.error);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteMeeting({}, fd);
      router.refresh();
    });
  }

  function MeetingRow({
    m,
    highlight = false,
  }: {
    m: OptimisticMeeting;
    highlight?: boolean;
  }) {
    const canDelete =
      !m.pending &&
      (currentUser.role === "ADMIN" || m.author?.id === currentUser.id);
    return (
      <div
        className={`rounded-xl border p-4 transition-opacity ${
          m.pending ? "opacity-60" : "opacity-100"
        } ${highlight ? "border-brand-200 bg-brand-50/60" : "border-line bg-stone-50"}`}
      >
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-stone-900">
            {formatDateTime(m.date)}
          </span>
          {m.location && (
            <span className="badge border-stone-200 bg-white text-stone-600">
              {m.location}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2 text-xs text-stone-400">
            {m.author?.name ?? "Removed member"}
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="text-rose-600 hover:text-rose-700"
              >
                Delete
              </button>
            )}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-stone-700">
          {m.title}
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-stone-900">
        Meetings
        <span className="ml-2 text-stone-400">{optimistic.length}</span>
      </h2>

      <form ref={formRef} action={handleSubmit} className="mt-4 space-y-3">
        <input type="hidden" name="leadId" value={leadId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mt-date">Date &amp; time</label>
            <input
              id="mt-date"
              name="date"
              type="datetime-local"
              className="input cursor-pointer"
            />
          </div>
          <div>
            <label className="label" htmlFor="mt-location">Location (optional)</label>
            <input
              id="mt-location"
              name="location"
              placeholder="Google Meet / Office / Phone"
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="mt-title">What&apos;s the meeting about?</label>
          <input
            id="mt-title"
            name="title"
            placeholder="e.g. Proposal walkthrough with the client"
            className="input"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          {error ? (
            <p className="text-xs text-rose-700">{error}</p>
          ) : (
            <span className="text-xs text-stone-400">
              Future dates schedule an upcoming meeting; past dates are logged.
            </span>
          )}
          <button type="submit" disabled={isPending} className="btn-primary shrink-0">
            {isPending ? "Saving…" : "Save meeting"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-5">
        {optimistic.length === 0 && (
          <p className="rounded-xl border border-dashed border-line bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">
            No meetings yet. Schedule the next one above.
          </p>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Upcoming
              <span className="text-stone-400">{upcoming.length}</span>
            </div>
            {upcoming.map((m, i) => (
              <MeetingRow key={m.id} m={m} highlight={i === 0} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-400">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
              Past
              <span className="text-stone-400">{past.length}</span>
            </div>
            {past.map((m) => (
              <MeetingRow key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
