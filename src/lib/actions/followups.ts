"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { FOLLOWUP_CHANNELS } from "@/lib/constants";

export type ActionState = { ok?: boolean; error?: string };

const followupSchema = z.object({
  leadId: z.string().min(1),
  date: z.coerce.date({ errorMap: () => ({ message: "Pick a valid date" }) }),
  channel: z.enum(FOLLOWUP_CHANNELS as [string, ...string[]]),
  notes: z.string().trim().min(1, "Describe the follow-up").max(2000),
  nextDate: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : (v as Date))),
});

export async function addFollowup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const parsed = followupSchema.safeParse({
    leadId: formData.get("leadId"),
    date: formData.get("date"),
    channel: formData.get("channel") || "Call",
    notes: formData.get("notes"),
    nextDate: formData.get("nextDate") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
  if (!lead) return { error: "Lead not found." };

  await prisma.followup.create({
    data: {
      leadId: data.leadId,
      date: data.date,
      channel: data.channel,
      notes: data.notes,
      nextDate: data.nextDate,
      authorId: user.id,
    },
  });

  await prisma.activity.create({
    data: {
      action: `logged a ${data.channel} follow-up`,
      leadId: data.leadId,
      userId: user.id,
    },
  });

  revalidatePath(`/leads/${data.leadId}`);
  revalidatePath("/followups");
  revalidatePath("/admin7014");
  return { ok: true };
}

export async function deleteFollowup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing follow-up id." };

  const followup = await prisma.followup.findUnique({ where: { id } });
  if (!followup) return { error: "Follow-up not found." };

  // Only the author or an admin may delete a follow-up.
  if (user.role !== "ADMIN" && followup.authorId !== user.id) {
    return { error: "Not authorized." };
  }

  await prisma.followup.delete({ where: { id } });

  revalidatePath(`/leads/${followup.leadId}`);
  revalidatePath("/followups");
  return { ok: true };
}
