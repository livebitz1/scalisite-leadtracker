import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";
import LeadEditForm from "@/components/LeadEditForm";
import ReassignSelect from "@/components/ReassignSelect";
import NotesSection from "@/components/NotesSection";
import FollowupsSection from "@/components/FollowupsSection";
import MeetingsSection from "@/components/MeetingsSection";
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
      followups: {
        orderBy: { date: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      meetings: {
        orderBy: { date: "asc" },
        include: { author: { select: { id: true, name: true } } },
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
        <Link href="/leads" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to leads
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
              {lead.name}
            </h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1.5 break-words text-sm text-stone-500">
            {[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ") ||
              "No contact details"}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <div className="text-2xl font-semibold tabular-nums text-stone-900">
            {formatCurrency(lead.value)}
          </div>
          <div className="text-xs text-stone-400">Estimated value</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <LeadEditForm lead={lead} />

          {/* Meetings — schedule the next meeting, log past ones */}
          <MeetingsSection
            leadId={lead.id}
            meetings={lead.meetings}
            currentUser={{ id: user.id, name: user.name, role: user.role }}
          />

          {/* Follow-ups — date, channel, what was discussed, next follow-up */}
          <FollowupsSection
            leadId={lead.id}
            followups={lead.followups}
            currentUser={{ id: user.id, name: user.name, role: user.role }}
          />

          {/* Notes — optimistic, appears instantly on submit */}
          <NotesSection
            leadId={lead.id}
            notes={lead.notes}
            currentUser={{ name: user.name, role: user.role }}
          />
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-stone-900">Assignment</h2>
            {isAdmin ? (
              <ReassignSelect
                leadId={lead.id}
                currentAssigneeId={lead.assignedTo.id}
                members={members}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-stone-100 text-[11px] font-semibold text-stone-600">
                  {initials(lead.assignedTo.name)}
                </span>
                <span className="text-sm text-stone-700">
                  {lead.assignedTo.name}
                </span>
              </div>
            )}

            <dl className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-400">Source</dt>
                <dd className="text-stone-700">{lead.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-400">Created by</dt>
                <dd className="text-stone-700">{lead.createdBy.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-400">Created</dt>
                <dd className="text-stone-700">{formatDateTime(lead.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-400">Last updated</dt>
                <dd className="text-stone-700">{timeAgo(lead.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Activity timeline */}
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-stone-900">Activity</h2>
            {lead.activities.length === 0 ? (
              <p className="text-sm text-stone-400">No activity yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-line pl-4">
                {lead.activities.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-4 ring-white" />
                    <p className="text-sm text-stone-700">
                      <span className="font-medium text-stone-900">
                        {a.user?.name ?? "Removed member"}
                      </span>{" "}
                      {a.action}
                    </p>
                    <p className="text-xs text-stone-400">
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
