import type { LeadStatus } from "@prisma/client";

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
];

export const LEAD_SOURCES = [
  "Instagram",
  "Referral",
  "Website",
  "Cold Outreach",
  "LinkedIn",
  "Other",
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  LOST: "Lost",
};

// Muted, restrained color tints — subtle against the dark monochrome UI.
export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-white/10 text-white/80 border-white/15",
  CONTACTED: "bg-sky-500/10 text-sky-300/90 border-sky-400/20",
  QUALIFIED: "bg-violet-500/10 text-violet-300/90 border-violet-400/20",
  PROPOSAL_SENT: "bg-amber-500/10 text-amber-300/90 border-amber-400/20",
  WON: "bg-emerald-500/10 text-emerald-300/90 border-emerald-400/20",
  LOST: "bg-rose-500/10 text-rose-300/90 border-rose-400/20",
};
