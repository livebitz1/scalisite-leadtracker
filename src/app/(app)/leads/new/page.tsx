import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import AddLeadForm from "@/components/AddLeadForm";

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const members = isAdmin
    ? await prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-6">
        <Link href="/leads" className="text-sm text-white/45 hover:text-white">
          ← Back to leads
        </Link>
      </div>
      <PageHeader
        title="New lead"
        subtitle={
          isAdmin
            ? "Add a lead and assign it to a team member."
            : "Add a lead — it will be assigned to you."
        }
      />
      <AddLeadForm
        isAdmin={isAdmin}
        currentUserId={user.id}
        members={members}
      />
    </div>
  );
}
