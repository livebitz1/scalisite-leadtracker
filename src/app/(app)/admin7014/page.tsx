import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { LEAD_STATUSES, STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
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
      <div className="text-xs uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-2 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-white/35">{hint}</div>}
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
      take: 12,
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
          <h2 className="mb-5 text-sm font-semibold text-white">Leads by status</h2>
          {totalLeads === 0 ? (
            <p className="text-sm text-white/35">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {statusCounts.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <StatusBadge status={status} />
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${STATUS_STYLES[status].split(" ")[0]}`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-right text-sm tabular-nums text-white/70">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <h2 className="mb-5 text-sm font-semibold text-white">Recent activity</h2>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-white/35">No activity yet.</p>
          ) : (
            <ol className="space-y-4">
              {recentActivities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-[10px] font-semibold text-white/70">
                    {initials(a.user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white/75">
                      <span className="font-medium text-white">{a.user.name}</span>{" "}
                      {a.action}
                      {a.lead && (
                        <>
                          {" — "}
                          <Link
                            href={`/leads/${a.lead.id}`}
                            className="text-white/80 underline-offset-2 hover:underline"
                          >
                            {a.lead.name}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-white/35">{timeAgo(a.createdAt)}</p>
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
          <h2 className="text-sm font-semibold text-white">Member performance</h2>
        </div>

        {/* Mobile: cards */}
        <div className="divide-y divide-line/60 sm:hidden">
          {perMember.map((m) => (
            <div key={m.id} className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-[10px] font-semibold text-white/70">
                  {initials(m.name)}
                </span>
                <span className="truncate font-medium text-white">{m.name}</span>
                <span className="badge ml-auto border-white/15 bg-white/5 capitalize text-white/55">
                  {m.role.toLowerCase()}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <div className="text-sm font-semibold tabular-nums text-white">{m.leadCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/35">Leads</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <div className="text-sm font-semibold tabular-nums text-white">{m.wonCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/35">Won</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <div className="text-sm font-semibold tabular-nums text-white">{m.noteCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/35">Notes</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <div className="text-sm font-semibold tabular-nums text-white">{formatCurrency(m.pipeline)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-white/35">Pipeline</div>
                </div>
              </div>
              {m.latestNote && (
                <Link
                  href={`/leads/${m.latestNote.lead?.id ?? ""}`}
                  className="mt-3 block rounded-lg border border-line bg-white/[0.02] px-3 py-2"
                >
                  <div className="text-[10px] uppercase tracking-wide text-white/35">
                    Latest note
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/70">
                    {m.latestNote.content}
                  </p>
                  <div className="mt-1 truncate text-[11px] text-white/30">
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
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-white/40">
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
                  className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="max-w-[340px] px-6 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-[10px] font-semibold text-white/70">
                        {initials(m.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-white">{m.name}</div>
                        {m.latestNote ? (
                          <Link
                            href={`/leads/${m.latestNote.lead?.id ?? ""}`}
                            className="group/note mt-0.5 block min-w-0"
                            title={m.latestNote.content}
                          >
                            <span className="block truncate text-xs text-white/45 group-hover/note:text-white/70">
                              <span className="text-white/30">“</span>
                              {m.latestNote.content}
                              <span className="text-white/30">”</span>
                            </span>
                            <span className="block truncate text-[11px] text-white/30">
                              {m.latestNote.lead
                                ? `on ${m.latestNote.lead.name} · `
                                : ""}
                              {timeAgo(m.latestNote.createdAt)}
                            </span>
                          </Link>
                        ) : (
                          <div className="mt-0.5 text-xs text-white/25">
                            No notes yet
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="badge border-white/15 bg-white/5 capitalize text-white/60">
                      {m.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-white/80">
                    {m.leadCount}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-white/80">
                    {m.wonCount}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-white/80">
                    {m.noteCount}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-white/80">
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
