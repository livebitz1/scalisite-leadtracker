"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";

type Member = { id: string; name: string };

export default function LeadsFilters({
  members,
  isAdmin,
}: {
  members: Member[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounce the search input -> URL.
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== q) setParam("q", q);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, company, or email…"
          className="input pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          defaultValue={searchParams.get("status") ?? "all"}
          onChange={(e) => setParam("status", e.target.value)}
          className="input w-auto cursor-pointer"
        >
          <option value="all">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {isAdmin && (
          <select
            defaultValue={searchParams.get("assignee") ?? "all"}
            onChange={(e) => setParam("assignee", e.target.value)}
            className="input w-auto cursor-pointer"
          >
            <option value="all">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        <select
          defaultValue={searchParams.get("sort") ?? "updated"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="input w-auto cursor-pointer"
        >
          <option value="updated">Sort: Last updated</option>
          <option value="created">Sort: Date created</option>
          <option value="value">Sort: Value</option>
        </select>
      </div>
    </div>
  );
}
