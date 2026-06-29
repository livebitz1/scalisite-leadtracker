"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/session";

type NavItem = { href: string; label: string; icon: React.ReactNode };

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function IconLeads() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconMembers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7h-9" /><path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    ...(user.role === "ADMIN"
      ? [{ href: "/admin7014", label: "Dashboard", icon: <IconDashboard /> }]
      : []),
    { href: "/leads", label: "Leads", icon: <IconLeads /> },
    ...(user.role === "ADMIN"
      ? [{ href: "/members", label: "Members", icon: <IconMembers /> }]
      : []),
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-6 backdrop-blur-xl md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-glass">
          <Image
            src="/logo.png"
            alt="ScaliSite"
            width={36}
            height={36}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-white">
            ScaliSite
          </div>
          <div className="text-[11px] text-white/35">Lead Tracker</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-white/55 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <span className={active ? "text-white" : "text-white/45"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-line pt-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/5 text-xs font-semibold text-white/80">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">
              {user.name}
            </div>
            <div className="text-[11px] capitalize text-white/40">
              {user.role.toLowerCase()}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost w-full justify-start text-white/60"
        >
          <IconLogout />
          Sign out
        </button>
      </div>
    </aside>
  );
}
