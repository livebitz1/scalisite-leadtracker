import type { LeadStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";

export default function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
