import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import {
  LEAD_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  STATUS_BAR_STYLES,
} from "@/lib/constants";
import { formatCurrency, timeAgo, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

const OPEN_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "AGREEMENT_SENT",
];

const STAT_ACCENTS = {
  brand: "border-brand-200 bg-brand-50 text-brand-600",
  sky: "border-sky-200 bg-sky-50 text-sky-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  amber: "border-amber-200 bg-amber-50 text-amber-600",
} as const;

const svg = "h-4 w-4";
const IconUsers = (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);
const IconPipeline = (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
);
const IconTrophy = (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const IconPercent = (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);
const IconChart = (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const IconActivity = (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconTeam = (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// Small colored icon chip used in card headers.
function HeaderIcon({ accent, icon }: { accent: string; icon: React.ReactNode }) {
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-md border ${accent}`}>
      {icon}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: keyof typeof STAT_ACCENTS;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-stone-400">{label}</div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${STAT_ACCENTS[accent]}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 break-words text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
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
        <StatCard
          label="Total leads"
          value={String(totalLeads)}
          hint={`${wonCount} won`}
          accent="brand"
          icon={IconUsers}
        />
        <StatCard
          label="Open pipeline"
          value={formatCurrency(pipelineValue)}
          hint="Value of active leads"
          accent="sky"
          icon={IconPipeline}
        />
        <StatCard
          label="Won revenue"
          value={formatCurrency(wonValue)}
          hint={`${wonCount} closed deals`}
          accent="emerald"
          icon={IconTrophy}
        />
        <StatCard
          label="Conversion rate"
          value={`${conversion}%`}
          hint="Won / total leads"
          accent="amber"
          icon={IconPercent}
        />
      </div>

      {/* Leads by status */}
      <div className="mt-6 card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <HeaderIcon accent="border-violet-200 bg-violet-50 text-violet-600" icon={IconChart} />
            Leads by status
          </h2>
          {totalLeads === 0 ? (
            <p className="mt-4 text-sm text-stone-400">No leads yet.</p>
          ) : (
            <>
              {/* Single distribution bar — quick read of the whole pipeline. */}
              <div className="mt-4 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-stone-100">
                {statusCounts
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <div
                      key={s.status}
                      className={STATUS_BAR_STYLES[s.status]}
                      style={{ width: `${(s.count / totalLeads) * 100}%` }}
                      title={`${STATUS_LABELS[s.status]}: ${s.count}`}
                    />
                  ))}
              </div>
              {/* Compact legend with counts. */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {statusCounts.map(({ status, count }) => (
                  <div
                    key={status}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${STATUS_STYLES[status]}`}
                  >
                    <span className="min-w-0 truncate text-sm font-medium">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="shrink-0 text-lg font-bold tabular-nums text-stone-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      {/* Recent activity */}
      <div className="mt-6 card p-5 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-stone-900">
            <HeaderIcon accent="border-sky-200 bg-sky-50 text-sky-600" icon={IconActivity} />
            Recent activity
          </h2>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-stone-400">No activity yet.</p>
          ) : (
            <ol className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
              {recentActivities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-[10px] font-semibold text-brand-700">
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
                            className="font-medium text-brand-700 underline-offset-2 hover:underline"
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

      {/* Per-member performance */}
      <div className="mt-6 card overflow-hidden">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <HeaderIcon accent="border-amber-200 bg-amber-50 text-amber-600" icon={IconTeam} />
            Member performance
          </h2>
        </div>

        {/* Mobile: cards */}
        <div className="divide-y divide-line/60 sm:hidden">
          {perMember.map((m) => (
            <div key={m.id} className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-[10px] font-semibold text-brand-700">
                  {initials(m.name)}
                </span>
                <span className="truncate font-medium text-stone-900">{m.name}</span>
                <span
                  className={`badge ml-auto capitalize ${
                    m.role === "ADMIN"
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-stone-200 bg-stone-100 text-stone-500"
                  }`}
                >
                  {m.role.toLowerCase()}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-stone-50 py-2">
                  <div className="text-sm font-semibold tabular-nums text-stone-900">{m.leadCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-stone-400">Leads</div>
                </div>
                <div className="rounded-lg bg-emerald-50 py-2">
                  <div className="text-sm font-semibold tabular-nums text-emerald-700">{m.wonCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-emerald-600/70">Won</div>
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
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-[10px] font-semibold text-brand-700">
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
                    <span
                      className={`badge capitalize ${
                        m.role === "ADMIN"
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : "border-stone-200 bg-stone-100 text-stone-600"
                      }`}
                    >
                      {m.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-stone-700">
                    {m.leadCount}
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-emerald-700">
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
