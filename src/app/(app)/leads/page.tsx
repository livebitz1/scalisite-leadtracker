import Link from "next/link";
import type { Prisma, LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import LeadsFilters from "@/components/LeadsFilters";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { LEAD_STATUSES } from "@/lib/constants";
import { formatCurrency, timeAgo, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  assignee?: string;
  sort?: string;
  mine?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const mine = sp.mine === "1";

  const where: Prisma.LeadWhereInput = {};

  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q, mode: "insensitive" } },
      { company: { contains: sp.q, mode: "insensitive" } },
      { email: { contains: sp.q, mode: "insensitive" } },
    ];
  }
  if (sp.status && LEAD_STATUSES.includes(sp.status as LeadStatus)) {
    where.status = sp.status as LeadStatus;
  }
  if (isAdmin && sp.assignee && sp.assignee !== "all") {
    where.assignedToId = sp.assignee;
  }
  if (mine) {
    where.assignedToId = user.id;
  }

  let orderBy: Prisma.LeadOrderByWithRelationInput = { updatedAt: "desc" };
  if (sp.sort === "value") orderBy = { value: "desc" };
  else if (sp.sort === "created") orderBy = { createdAt: "desc" };

  const [leads, members, totalCount] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      include: { assignedTo: { select: { id: true, name: true } } },
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { role: { in: ["ADMIN", "MEMBER"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.lead.count(),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} of ${totalCount} ${totalCount === 1 ? "lead" : "leads"}`}
        action={
          <Link href="/leads/new" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New lead
          </Link>
        }
      />

      {!isAdmin && (
        <div className="mb-5 inline-flex rounded-lg border border-line bg-stone-50 p-1 text-sm">
          <Link
            href="/leads"
            className={`rounded-md px-3 py-1.5 transition ${
              !mine ? "bg-brand-600 text-white shadow-sm" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            All leads
          </Link>
          <Link
            href="/leads?mine=1"
            className={`rounded-md px-3 py-1.5 transition ${
              mine ? "bg-brand-600 text-white shadow-sm" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Assigned to me
          </Link>
        </div>
      )}

      <LeadsFilters members={members} isAdmin={isAdmin} />

      {leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Try adjusting your filters, or add a new lead to get started."
          action={
            <Link href="/leads/new" className="btn-primary">
              Add your first lead
            </Link>
          }
        />
      ) : (
        <>
        {/* Mobile: stacked cards */}
        <div className="space-y-3 md:hidden">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="card block p-4 transition active:bg-stone-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-stone-900">
                    {lead.name}
                  </div>
                  <div className="truncate text-xs text-stone-400">
                    {lead.company || lead.email}
                  </div>
                </div>
                <StatusBadge status={lead.status} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/60 pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-stone-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-stone-100 text-[9px] font-semibold text-stone-600">
                    {initials(lead.assignedTo.name)}
                  </span>
                  {lead.assignedTo.name}
                </span>
                <span className="tabular-nums text-stone-700">
                  {formatCurrency(lead.value)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop / tablet: table */}
        <div className="card hidden overflow-hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-stone-400">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Assigned</th>
                  <th className="px-5 py-3 text-right font-medium">Value</th>
                  <th className="px-5 py-3 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group border-b border-line/60 transition last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/leads/${lead.id}`} className="block">
                        <span className="font-medium text-stone-900 group-hover:underline">
                          {lead.name}
                        </span>
                        <span className="block text-xs text-stone-400">
                          {lead.email}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">
                      {lead.company || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">{lead.source}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-stone-100 text-[10px] font-semibold text-stone-600">
                          {initials(lead.assignedTo.name)}
                        </span>
                        <span className="text-stone-600">
                          {lead.assignedTo.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-stone-700">
                      {formatCurrency(lead.value)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-stone-400">
                      {timeAgo(lead.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
