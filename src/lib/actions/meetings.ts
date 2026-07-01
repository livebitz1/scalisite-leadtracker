"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ActionState = { ok?: boolean; error?: string };

const meetingSchema = z.object({
  leadId: z.string().min(1),
  date: z.coerce.date({ errorMap: () => ({ message: "Pick a valid date & time" }) }),
  title: z.string().trim().min(1, "Add what the meeting is about").max(200),
  location: z.string().trim().max(160).optional().or(z.literal("")),
});

export async function addMeeting(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const parsed = meetingSchema.safeParse({
    leadId: formData.get("leadId"),
    date: formData.get("date"),
    title: formData.get("title"),
    location: formData.get("location") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
  if (!lead) return { error: "Lead not found." };

  await prisma.meeting.create({
    data: {
      leadId: data.leadId,
      date: data.date,
      title: data.title,
      location: data.location ? data.location : null,
      authorId: user.id,
    },
  });

  const upcoming = data.date.getTime() >= Date.now();
  await prisma.activity.create({
    data: {
      action: upcoming ? `scheduled a meeting` : `logged a past meeting`,
      leadId: data.leadId,
      userId: user.id,
    },
  });

  revalidatePath(`/leads/${data.leadId}`);
  revalidatePath("/admin7014");
  return { ok: true };
}

export async function deleteMeeting(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing meeting id." };

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return { error: "Meeting not found." };

  // Only the author or an admin may delete a meeting.
  if (user.role !== "ADMIN" && meeting.authorId !== user.id) {
    return { error: "Not authorized." };
  }

  await prisma.meeting.delete({ where: { id } });

  revalidatePath(`/leads/${meeting.leadId}`);
  return { ok: true };
}
