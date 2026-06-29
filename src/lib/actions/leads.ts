"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { LEAD_STATUSES, LEAD_SOURCES, STATUS_LABELS } from "@/lib/constants";

export type ActionState = { ok?: boolean; error?: string };

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required").max(160),
  phone: z.string().trim().min(1, "Phone is required").max(40),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.enum(LEAD_SOURCES as [string, ...string[]]),
  status: z.enum(LEAD_STATUSES as [LeadStatus, ...LeadStatus[]]),
  value: z
    .union([z.coerce.number().min(0), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
});

function parseValue(raw: FormDataEntryValue | null): number | null {
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------

export async function createLead(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    value: parseValue(formData.get("value")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Members can only assign to themselves; admins may choose an assignee.
  const requestedAssignee = (formData.get("assignedToId") as string) || user.id;
  const assignedToId = user.role === "ADMIN" ? requestedAssignee : user.id;

  const data = parsed.data;
  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company ? data.company : null,
      source: data.source,
      status: data.status,
      value: data.value,
      assignedToId,
      createdById: user.id,
    },
  });

  await prisma.activity.create({
    data: {
      action: `created this lead`,
      leadId: lead.id,
      userId: user.id,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/admin7014");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing lead id." };

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return { error: "Lead not found." };

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    status: formData.get("status"),
    value: parseValue(formData.get("value")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  await prisma.lead.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company ? data.company : null,
      source: data.source,
      value: data.value,
      status: data.status,
    },
  });

  // Log a status change explicitly when it differs.
  if (existing.status !== data.status) {
    await prisma.activity.create({
      data: {
        action: `changed status from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[data.status]}`,
        leadId: id,
        userId: user.id,
      },
    });
  } else {
    await prisma.activity.create({
      data: { action: `updated lead details`, leadId: id, userId: user.id },
    });
  }

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/admin7014");
  return { ok: true };
}

export async function setLeadStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  const status = formData.get("status") as LeadStatus;
  if (!id || !LEAD_STATUSES.includes(status)) {
    return { error: "Invalid request." };
  }

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return { error: "Lead not found." };
  if (existing.status === status) return { ok: true };

  await prisma.lead.update({ where: { id }, data: { status } });
  await prisma.activity.create({
    data: {
      action: `changed status from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[status]}`,
      leadId: id,
      userId: user.id,
    },
  });

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/admin7014");
  return { ok: true };
}

export async function reassignLead(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  // Reassigning is an admin-only capability — enforced server-side.
  if (user.role !== "ADMIN") return { error: "Not authorized." };

  const id = formData.get("id") as string;
  const assignedToId = formData.get("assignedToId") as string;
  if (!id || !assignedToId) return { error: "Invalid request." };

  const [existing, newAssignee] = await Promise.all([
    prisma.lead.findUnique({ where: { id }, include: { assignedTo: true } }),
    prisma.user.findUnique({ where: { id: assignedToId } }),
  ]);
  if (!existing) return { error: "Lead not found." };
  if (!newAssignee) return { error: "Member not found." };
  if (existing.assignedToId === assignedToId) return { ok: true };

  await prisma.lead.update({ where: { id }, data: { assignedToId } });
  await prisma.activity.create({
    data: {
      action: `reassigned this lead from ${existing.assignedTo.name} to ${newAssignee.name}`,
      leadId: id,
      userId: user.id,
    },
  });

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/admin7014");
  return { ok: true };
}

export async function addNote(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const leadId = formData.get("leadId") as string;
  const content = (formData.get("content") as string)?.trim();
  if (!leadId) return { error: "Missing lead." };
  if (!content) return { error: "Note cannot be empty." };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { error: "Lead not found." };

  await prisma.note.create({
    data: { content, leadId, authorId: user.id },
  });
  await prisma.activity.create({
    data: { action: `added a note`, leadId, userId: user.id },
  });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}
