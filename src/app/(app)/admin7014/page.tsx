import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { LEAD_STATUSES, STATUS_LABELS, STATUS_BAR_STYLES } from "@/lib/constants";
import { formatCurrency, timeAgo, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

const OPEN_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
];

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-xs uppercase tracking-wide text-stone-400">{label}</div>
      <div className="mt-2 break-words text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-stone-400">{hint}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  await requireAdmin();

  const [leads, users, recentActivities] = await Promise.all([
    prisma.lead.findMany({
      select: { status: true, value: true, assignedToId: true },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        _count: { select: { notes: true } },
        // Most recent note authored by this member, with its lead for linking.
        notes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            lead: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true } },
        lead: { select: { id: true, name: true } },
      },
    }),
  ]);

  const totalLeads = leads.length;
  const wonCount = leads.filter((l) => l.status === "WON").length;
  const pipelineValue = leads
    .filter((l) => OPEN_STATUSES.includes(l.status))
    .reduce((sum, l) => sum + (l.value ?? 0), 0);
  const wonValue = leads
    .filter((l) => l.status === "WON")
    .reduce((sum, l) => sum + (l.value ?? 0), 0);
  const conversion =
    totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  const statusCounts = LEAD_STATUSES.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));

  // Per-member performance.
  const perMember = users
    .map((u) => {
      const assigned = leads.filter((l) => l.assignedToId === u.id);
      return {
        ...u,
        leadCount: assigned.length,
        wonCount: assigned.filter((l) => l.status === "WON").length,
        noteCount: u._count.notes,
        latestNote: u.notes[0] ?? null,
        pipeline: assigned
          .filter((l) => OPEN_STATUSES.includes(l.status))
          .reduce((s, l) => s + (l.value ?? 0), 0),
      };
    })
    .sort((a, b) => b.leadCount - a.leadCount);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Agency-wide overview across all leads and members."
        action={
          <Link href="/leads/new" className="btn-primary">
            New lead
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={String(totalLeads)} hint={`${wonCount} won`} />
        <StatCard
          label="Open pipeline"
          value={formatCurrency(pipelineValue)}
          hint="Value of active leads"
        />
        <StatCard
          label="Won revenue"
          value={formatCurrency(wonValue)}
          hint={`${wonCount} closed deals`}
        />
        <StatCard
          label="Conversion rate"
          value={`${conversion}%`}
          hint="Won / total leads"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Leads by status */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-5 text-sm font-semibold text-stone-900">Leads by status</h2>
          {totalLeads === 0 ? (
            <p className="text-sm text-stone-400">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {statusCounts.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <StatusBadge status={status} />
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full ${STATUS_BAR_STYLES[status]}`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-right text-sm tabular-nums text-stone-600">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <h2 className="mb-5 text-sm font-semibold text-stone-900">Recent activity</h2>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-stone-400">No activity yet.</p>
          ) : (
            <ol className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
              {recentActivities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 text-[10px] font-semibold text-stone-600">
                    {a.user ? initials(a.user.name) : "—"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-stone-700">
                      <span className="font-medium text-stone-900">{a.user?.name ?? "Removed member"}</span>{" "}
                      {a.action}
                      {a.lead && (
                        <>
                          {" — "}
                          <Link
                            href={`/leads/${a.lead.id}`}
                            className="text-stone-700 underline-offset-2 hover:underline"
                          >
                            {a.lead.name}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-stone-400">{timeAgo(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Per-member performance */}
      <div className="mt-6 card overflow-hidden">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-stone-900">Member performance</h2>
        </div>

        {/* Mobile: cards */}
        <div className="divide-y divide-line/60 sm:hidden">
          {perMember.map((m) => (
            <div key={m.id} className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 text-[10px] font-semibold text-stone-600">
                  {initials(m.name)}
                </span>
                <span className="truncate font-medium text-stone-900">{m.name}</span>
                <span className="badge ml-auto border-stone-200 bg-stone-100 capitalize text-stone-500">
                  {m.role.toLowerCase()}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-stone-50 py-2">
                  <div className="text-sm font-semibold tabular-nums text-stone-900">{m.leadCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-stone-400">Leads</div>
                </div>
                <div className="rounded-lg bg-stone-50 py-2">
                  <div className="text-sm font-semibold tabular-nums text-stone-900">{m.wonCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-stone-400">Won</div>
                </div>
                <div className="rounded-lg bg-stone-50 py-2">
                  <div className="text-sm font-semibold tabular-nums text-stone-900">{m.noteCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-stone-400">Notes</div>
                </div>
                <div className="rounded-lg bg-stone-50 py-2">
                  <div className="text-sm font-semibold tabular-nums text-stone-900">{formatCurrency(m.pipeline)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-stone-400">Pipeline</div>
                </div>
              </div>
              {m.latestNote && (
                <Link
                  href={`/leads/${m.latestNote.lead?.id ?? ""}`}
                  className="mt-3 block rounded-lg border border-line bg-stone-50 px-3 py-2"
                >
                  <div className="text-[10px] uppercase tracking-wide text-stone-400">
                    Latest note
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">
                    {m.latestNote.content}
                  </p>
                  <div className="mt-1 truncate text-[11px] text-stone-400">
                    {m.latestNote.lead ? `on ${m.latestNote.lead.name} · ` : ""}
                    {timeAgo(m.latestNote.createdAt)}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Tablet / desktop: table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-stone-400">
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 text-right font-medium">Leads</th>
                <th className="px-6 py-3 text-right font-medium">Won</th>
                <th className="px-6 py-3 text-right font-medium">Notes</th>
                <th className="px-6 py-3 text-right font-medium">Open pipeline</th>
              </tr>
            </thead>
            <tbody>
              {perMember.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-line/60 last:border-0 hover:bg-stone-50"
                >
                  <td className="max-w-[340px] px-6 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 text-[10px] font-semibold text-stone-600">
                        {initials(m.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-stone-900">{m.name}</div>
                        {m.latestNote ? (
                          <Link
                            href={`/leads/${m.latestNote.lead?.id ?? ""}`}
                            className="group/note mt-0.5 block min-w-0"
                            title={m.latestNote.content}
                          >
                            <span className="block truncate text-xs text-stone-500 group-hover/note:text-stone-600">
                              <span className="text-stone-400">“</span>
                              {m.latestNote.content}
                              <span className="text-stone-400">”</span>
                            </span>
                            <span className="block truncate text-[11px] text-stone-400">
                              {m.latestNote.lead
                                ? `on ${m.latestNote.lead.name} · `
                                : ""}
                              {timeAgo(m.latestNote.createdAt)}
                            </span>
                          </Link>
                        ) : (
                          <div className="mt-0.5 text-xs text-stone-300">
                            No notes yet
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="badge border-stone-200 bg-stone-100 capitalize text-stone-600">
                      {m.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-stone-700">
                    {m.leadCount}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-stone-700">
                    {m.wonCount}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-stone-700">
                    {m.noteCount}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-stone-700">
                    {formatCurrency(m.pipeline)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
