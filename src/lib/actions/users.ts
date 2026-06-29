"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ActionState = { ok?: boolean; error?: string };

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function createMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  if (user.role !== "ADMIN") return { error: "Not authorized." };

  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "MEMBER",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "A user with that email already exists." };

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, hashedPassword, role },
  });

  revalidatePath("/members");
  revalidatePath("/admin7014");
  return { ok: true };
}

export async function deleteMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  if (user.role !== "ADMIN") return { error: "Not authorized." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing user id." };
  if (id === user.id) return { error: "You cannot delete your own account." };

  const target = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { assignedLeads: true } } },
  });
  if (!target) return { error: "User not found." };

  if (target._count.assignedLeads > 0) {
    return {
      error: `Reassign this member's ${target._count.assignedLeads} lead(s) before deleting them.`,
    };
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/members");
  revalidatePath("/admin7014");
  return { ok: true };
}
