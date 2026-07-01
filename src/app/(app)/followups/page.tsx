import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import FollowupsFilters from "@/components/FollowupsFilters";
import { FOLLOWUP_CHANNELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; channel?: string; due?: string };

const CHANNEL_STYLES: Record<string, string> = {
  Call: "border-brand-200 bg-brand-50 text-brand-700",
  WhatsApp: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Email: "border-sky-200 bg-sky-50 text-sky-700",
  Meeting: "border-violet-200 bg-violet-50 text-violet-700",
  SMS: "border-amber-200 bg-amber-50 text-amber-700",
  Other: "border-stone-200 bg-stone-100 text-stone-600",
};

export default async function FollowupsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const where: Prisma.FollowupWhereInput = {};
  const q = sp.q?.trim();
  if (q) {
    where.OR = [
      { lead: { name: { contains: q, mode: "insensitive" } } },
      { lead: { company: { contains: q, mode: "insensitive" } } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }
  if (sp.channel && FOLLOWUP_CHANNELS.includes(sp.channel)) {
    where.channel = sp.channel;
  }
  if (sp.due === "overdue") where.nextDate = { lt: startOfToday };
  else if (sp.due === "upcoming") where.nextDate = { gte: startOfToday };
  else if (sp.due === "scheduled") where.nextDate = { not: null };

  const hasFilters = Boolean(q || sp.channel || sp.due);

  const [followups, totalCount] = await Promise.all([
    prisma.followup.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        lead: { select: { id: true, name: true, company: true, status: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.followup.count(),
  ]);

  // Group by client (lead). followups are already sorted date desc, so each
  // group's items and the group order stay newest-first.
  const groups = new Map<
    string,
    { lead: (typeof followups)[number]["lead"]; items: typeof followups }
  >();
  for (const f of followups) {
    const g = groups.get(f.leadId) ?? { lead: f.lead, items: [] };
    g.items.push(f);
    groups.set(f.leadId, g);
  }
  const clientGroups = [...groups.values()];

  // Scheduled follow-ups (have a next date), soonest first; flag overdue.
  const scheduled = followups
    .filter((f) => f.nextDate)
    .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime());

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Follow-ups"
        subtitle={
          hasFilters
            ? `${followups.length} of ${totalCount} follow-up${totalCount === 1 ? "" : "s"} match`
            : `${followups.length} follow-up${followups.length === 1 ? "" : "s"} across ${clientGroups.length} client${clientGroups.length === 1 ? "" : "s"}.`
        }
      />

      {totalCount === 0 ? (
        <EmptyState
          title="No follow-ups yet"
          description="Follow-ups logged on a lead's page will appear here, grouped by client."
          action={
            <Link href="/leads" className="btn-primary">
              Go to leads
            </Link>
          }
        />
      ) : (
        <>
          <FollowupsFilters />

          {followups.length === 0 ? (
            <EmptyState
              title="No follow-ups match"
              description="Try a different search term or clear the filters."
            />
          ) : (
        <div className="space-y-6">
          {/* Scheduled follow-ups */}
          {scheduled.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-stone-900">
                  Scheduled follow-ups
                  <span className="ml-2 text-stone-400">{scheduled.length}</span>
                </h2>
              </div>
              <ul>
                {scheduled.map((f) => {
                  const overdue = new Date(f.nextDate!) < startOfToday;
                  return (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/60 px-5 py-3.5 last:border-0 sm:px-6"
                    >
                      <span
                        className={`badge ${
                          overdue
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-brand-200 bg-brand-50 text-brand-700"
                        }`}
                      >
                        {overdue ? "Overdue · " : "Due · "}
                        {formatDate(f.nextDate!)}
                      </span>
                      <Link
                        href={`/leads/${f.lead.id}`}
                        className="font-medium text-stone-900 hover:underline"
                      >
                        {f.lead.name}
                      </Link>
                      {f.lead.company && (
                        <span className="text-sm text-stone-400">{f.lead.company}</span>
                      )}
                      <span className="ml-auto truncate text-xs text-stone-400">
                        last: {f.channel} on {formatDate(f.date)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Per-client history */}
          <div className="space-y-4">
            {clientGroups.map(({ lead, items }) => (
              <div key={lead.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-stone-900 hover:underline"
                    >
                      {lead.name}
                    </Link>
                    {lead.company && (
                      <span className="text-sm text-stone-400">· {lead.company}</span>
                    )}
                    <StatusBadge status={lead.status} />
                  </div>
                  <span className="text-xs text-stone-400">
                    {items.length} follow-up{items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <ul className="divide-y divide-line/60">
                  {items.map((f) => (
                    <li key={f.id} className="px-5 py-4 sm:px-6">
                      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
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
                        <span className="ml-auto text-xs text-stone-400">
                          by {f.author?.name ?? "Removed member"}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700">
                        {f.notes}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
          )}
        </>
      )}
    </div>
  );
}
