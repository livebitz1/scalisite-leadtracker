import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import CreateMemberForm from "@/components/CreateMemberForm";
import DeleteMemberButton from "@/components/DeleteMemberButton";
import { formatDate, formatDateTime, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const admin = await requireAdmin();

  const [members, activities] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: { _count: { select: { assignedLeads: true } } },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: { select: { name: true } },
        lead: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Members & Settings"
        subtitle="Manage team accounts and review the activity log."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-sm font-semibold text-stone-900">
                Team members
                <span className="ml-2 text-stone-400">{members.length}</span>
              </h2>
            </div>
            <ul>
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-4 border-b border-line/60 px-6 py-4 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 text-xs font-semibold text-stone-700">
                      {initials(m.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-stone-900">
                          {m.name}
                        </span>
                        <span className="badge border-stone-200 bg-stone-100 capitalize text-stone-500">
                          {m.role.toLowerCase()}
                        </span>
                        {m.id === admin.id && (
                          <span className="text-[11px] text-stone-400">(you)</span>
                        )}
                      </div>
                      <div className="truncate text-xs text-stone-400">
                        {m.email} · {m._count.assignedLeads} leads · joined{" "}
                        {formatDate(m.createdAt)}
                      </div>
                    </div>
                  </div>
                  {m.id !== admin.id && (
                    <DeleteMemberButton id={m.id} name={m.name} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <CreateMemberForm />
        </div>
      </div>

      {/* Activity log */}
      <div className="mt-6 card overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold text-stone-900">Activity log</h2>
        </div>
        {activities.length === 0 ? (
          <p className="px-6 py-8 text-sm text-stone-400">No activity recorded yet.</p>
        ) : (
          <ul>
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 border-b border-line/60 px-6 py-3.5 last:border-0"
              >
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
                <span className="shrink-0 text-xs text-stone-400">
                  {formatDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
