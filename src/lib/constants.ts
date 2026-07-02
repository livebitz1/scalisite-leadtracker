import type { LeadStatus } from "@prisma/client";

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "AGREEMENT_SENT",
  "WON",
  "LOST",
];

export const LEAD_SOURCES = [
  "Instagram",
  "Ads",
  "Referral",
  "Website",
  "Cold Outreach",
  "LinkedIn",
  "Other",
];

export const FOLLOWUP_CHANNELS = [
  "Call",
  "WhatsApp",
  "Email",
  "Meeting",
  "SMS",
  "Other",
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  AGREEMENT_SENT: "Agreement Sent",
  WON: "Won",
  LOST: "Lost",
};

// Soft, scannable status pills tuned for the light theme.
export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-stone-100 text-stone-600 border-stone-200",
  CONTACTED: "bg-sky-50 text-sky-700 border-sky-200",
  QUALIFIED: "bg-violet-50 text-violet-700 border-violet-200",
  AGREEMENT_SENT: "bg-amber-50 text-amber-700 border-amber-200",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-rose-50 text-rose-700 border-rose-200",
};

// Solid fills used for the dashboard "leads by status" bars.
export const STATUS_BAR_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-stone-400",
  CONTACTED: "bg-sky-500",
  QUALIFIED: "bg-violet-500",
  AGREEMENT_SENT: "bg-amber-500",
  WON: "bg-emerald-500",
  LOST: "bg-rose-500",
};
