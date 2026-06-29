import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Bootstraps a clean database: removes all data and creates a single admin
// account. The admin signs in with the password only (no email) — the password
// is read from ADMIN_PASSWORD in the environment.
async function main() {
  console.log("🌱  Resetting ScaliSite Lead Tracker to a clean state…");

  // Wipe everything (respecting FK order).
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Add it to .env.local before seeding."
    );
  }

  // The admin has no real email — a fixed internal address satisfies the
  // unique/non-null constraint and is never used for login.
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@scalisite.local";
  const adminName = process.env.ADMIN_NAME ?? "Administrator";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅  Database cleaned. One admin account created.");
  console.log("");
  console.log("   Sign in as admin:");
  console.log("   ─────────────────");
  console.log("   Email     (leave blank)");
  console.log("   Password  set via ADMIN_PASSWORD in .env.local");
  console.log("");
  console.log("   Add team members from Members & Settings once signed in.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
