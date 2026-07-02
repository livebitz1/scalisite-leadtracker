import type { LeadStatus } from "@prisma/client";
import { LEAD_STATUSES, STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";

const ACCENTS = {
  brand: "border-brand-200 bg-brand-50 text-brand-600",
  sky: "border-sky-200 bg-sky-50 text-sky-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  amber: "border-amber-200 bg-amber-50 text-amber-600",
} as const;

function Stat({
  label,
  value,
  hint,
  accent,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: keyof typeof ACCENTS;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-stone-400">
          {label}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${ACCENTS[accent]}`}
        >
          {children}
        </span>
      </div>
      <div className="mt-2 break-words text-xl font-semibold tracking-tight text-stone-900">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-stone-400">{hint}</div>}
    </div>
  );
}

export default function LeadsOverview({
  leads,
}: {
  leads: {
    status: LeadStatus;
    _count: { followups: number; meetings: number };
  }[];
}) {
  const total = leads.length;
  const percentOfTotal = (count: number) =>
    total > 0 ? `${Math.round((count / total) * 100)}% of leads` : "0% of leads";

  const qualifiedCount = leads.filter((l) => l.status === "QUALIFIED").length;
  const proposalCount = leads.filter((l) => l.status === "AGREEMENT_SENT").length;
  const meetingsBookedCount = leads.filter((l) => l._count.meetings > 0).length;
  const followupsLoggedCount = leads.filter((l) => l._count.followups > 0).length;

  const statusCounts = LEAD_STATUSES.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Qualified leads" value={String(qualifiedCount)} hint={percentOfTotal(qualifiedCount)} accent="brand">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </Stat>
        <Stat label="Agreement sent" value={String(proposalCount)} hint={percentOfTotal(proposalCount)} accent="amber">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        </Stat>
        <Stat label="Meetings booked" value={String(meetingsBookedCount)} hint={percentOfTotal(meetingsBookedCount)} accent="sky">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="m9 16 2 2 4-5" />
          </svg>
        </Stat>
        <Stat label="Leads followed up" value={String(followupsLoggedCount)} hint={percentOfTotal(followupsLoggedCount)} accent="emerald">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="M8 9h8M8 13h5" />
          </svg>
        </Stat>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusCounts.map(({ status, count }) => (
            <span key={status} className={`badge ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
              <span className="ml-1.5 font-bold tabular-nums text-stone-900">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
