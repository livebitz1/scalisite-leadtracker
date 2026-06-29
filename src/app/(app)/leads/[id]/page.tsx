import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";
import LeadEditForm from "@/components/LeadEditForm";
import ReassignSelect from "@/components/ReassignSelect";
import NoteForm from "@/components/NoteForm";
import { formatCurrency, formatDateTime, timeAgo, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const isAdmin = user.role === "ADMIN";

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, role: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!lead) notFound();

  const members = isAdmin
    ? await prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/leads" className="text-sm text-white/45 hover:text-white">
          ← Back to leads
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {lead.name}
            </h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1.5 break-words text-sm text-white/45">
            {lead.company ? `${lead.company} · ` : ""}
            {lead.email} · {lead.phone}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <div className="text-2xl font-semibold tabular-nums text-white">
            {formatCurrency(lead.value)}
          </div>
          <div className="text-xs text-white/40">Estimated value</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <LeadEditForm lead={lead} />

          {/* Notes */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white">
              Notes
              <span className="ml-2 text-white/35">{lead.notes.length}</span>
            </h2>
            <NoteForm leadId={lead.id} />

            <div className="mt-6 space-y-3">
              {lead.notes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-white/[0.015] px-4 py-6 text-center text-sm text-white/35">
                  No notes yet. Add the first one above.
                </p>
              ) : (
                lead.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-line bg-white/[0.02] p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-[10px] font-semibold text-white/70">
                        {initials(note.author.name)}
                      </span>
                      <span className="text-sm font-medium text-white/90">
                        {note.author.name}
                      </span>
                      <span
                        className={`badge ${
                          note.author.role === "ADMIN"
                            ? "border-white/20 bg-white/10 text-white/70"
                            : "border-sky-400/20 bg-sky-500/10 text-sky-300/90"
                        }`}
                      >
                        {note.author.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                      <span className="ml-auto text-xs text-white/35">
                        {timeAgo(note.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/75">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Assignment</h2>
            {isAdmin ? (
              <ReassignSelect
                leadId={lead.id}
                currentAssigneeId={lead.assignedTo.id}
                members={members}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white/5 text-[11px] font-semibold text-white/70">
                  {initials(lead.assignedTo.name)}
                </span>
                <span className="text-sm text-white/80">
                  {lead.assignedTo.name}
                </span>
              </div>
            )}

            <dl className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/40">Source</dt>
                <dd className="text-white/80">{lead.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/40">Created by</dt>
                <dd className="text-white/80">{lead.createdBy.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/40">Created</dt>
                <dd className="text-white/80">{formatDateTime(lead.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/40">Last updated</dt>
                <dd className="text-white/80">{timeAgo(lead.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Activity timeline */}
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Activity</h2>
            {lead.activities.length === 0 ? (
              <p className="text-sm text-white/35">No activity yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-line pl-4">
                {lead.activities.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-white/30 ring-4 ring-base" />
                    <p className="text-sm text-white/75">
                      <span className="font-medium text-white">
                        {a.user.name}
                      </span>{" "}
                      {a.action}
                    </p>
                    <p className="text-xs text-white/35">
                      {formatDateTime(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
