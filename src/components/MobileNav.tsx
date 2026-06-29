"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { SessionUser } from "@/lib/session";

export default function MobileNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const items = [
    ...(user.role === "ADMIN" ? [{ href: "/admin7014", label: "Dashboard" }] : []),
    { href: "/leads", label: "Leads" },
    ...(user.role === "ADMIN" ? [{ href: "/members", label: "Members" }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/70 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-white p-0.5">
            <Image
              src="/logo.png"
              alt="ScaliSite"
              width={28}
              height={28}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-sm font-semibold text-white">ScaliSite</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-white/50 hover:text-white"
        >
          Sign out
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
