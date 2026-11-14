"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { signOut } from "@/app/admin/actions";
import { org } from "@/content/site";
import { cx } from "@/components/ui";

type Item = { label: string; href: string; match: (path: string, status: string | null) => boolean; badge?: number };

export function Sidebar({ name, email, pending }: { name: string; email: string; pending: number }) {
  const path = usePathname();
  const status = useSearchParams().get("status");
  const details = useRef<HTMLDetailsElement>(null);

  // Close the phone menu after navigating.
  useEffect(() => {
    if (details.current) details.current.open = false;
  }, [path, status]);

  const calendar: Item[] = [
    { label: "Pending Submissions", href: "/admin/events?status=pending", match: (p, s) => p === "/admin/events" && s === "pending", badge: pending },
    { label: "Published Events", href: "/admin/events?status=published", match: (p, s) => p === "/admin/events" && s === "published" },
    { label: "All Events", href: "/admin/events", match: (p, s) => (p === "/admin/events" && !s) || (p.startsWith("/admin/events/") && p !== "/admin/events/new") || (p === "/admin/events" && !["pending", "published"].includes(s ?? "")) },
    { label: "Add Event", href: "/admin/events/new", match: (p) => p === "/admin/events/new" },
    { label: "Email Notifications", href: "/admin/emails", match: (p) => p.startsWith("/admin/emails") },
  ];

  const link = (item: Item) => {
    const active = item.match(path, status);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cx(
            "flex min-h-10 items-center justify-between gap-3 border-l-[3px] px-4 text-[0.9375rem] transition-colors",
            active ? "border-sun bg-white/10 font-semibold text-white" : "border-transparent text-white/80 hover:bg-white/5 hover:text-white",
          )}
        >
          {item.label}
          {item.badge ? <span className="label min-w-6 bg-sun px-1.5 py-0.5 text-center text-[0.6875rem] text-ink">{item.badge}</span> : null}
        </Link>
      </li>
    );
  };

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-7 py-6">
      <ul>{link({ label: "Overview", href: "/admin", match: (p) => p === "/admin" })}</ul>
      <div>
        <p className="label mb-2 px-4 text-[0.6875rem] text-sky">Calendar Management</p>
        <ul>{calendar.map(link)}</ul>
      </div>
      <div className="px-4">
        <p className="label mb-2 text-[0.6875rem] text-sky">Future Tools</p>
        <div className="border border-dashed border-white/25 p-3">
          <p className="text-[0.8125rem] font-semibold text-white">More Tools Coming Later</p>
          <p className="mt-1 text-[0.75rem] leading-snug text-white/70">
            This dashboard is designed to support additional Miami Athletic Association website management features in the future.
          </p>
        </div>
      </div>
      <div className="mt-auto">
        <p className="label mb-2 px-4 text-[0.6875rem] text-sky">Account</p>
        <p className="px-4 text-[0.875rem] font-semibold text-white">{name}</p>
        <p className="truncate px-4 text-[0.75rem] text-white/65">{email}</p>
        <ul className="mt-2">
          {link({ label: "Change Password", href: "/admin/account", match: (p) => p === "/admin/account" })}
          <li>
            <form action={signOut}>
              <button type="submit" className="flex min-h-10 w-full items-center border-l-[3px] border-transparent px-4 text-left text-[0.9375rem] text-white/80 hover:bg-white/5 hover:text-white">
                Sign Out
              </button>
            </form>
          </li>
          <li>
            <Link href="/calendar" className="flex min-h-10 items-center border-l-[3px] border-transparent px-4 text-[0.875rem] text-white/65 hover:text-white">
              View public calendar ↗
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-3">
      <span className="inline-flex shrink-0 bg-white p-1">
        <Image src="/images/brand/maa-logo-white.png" alt="" width={600} height={529} className="h-8 w-auto" unoptimized />
      </span>
      <span className="leading-tight">
        <span className="label block text-[0.625rem] text-white">{org.name}</span>
        <span className="block text-[0.75rem] text-white/70">Dashboard</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="on-dark sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto bg-navy lg:flex">
        <div className="border-b border-white/15 px-4 py-5">{brand}</div>
        {nav}
      </aside>
      {/* Phone and tablet */}
      <details ref={details} className="on-dark group sticky top-0 z-30 bg-navy lg:hidden">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
          {brand}
          <span className="label flex min-h-11 items-center gap-2 text-white">
            Menu{pending ? <span className="bg-sun px-1.5 text-ink">{pending}</span> : null}
          </span>
        </summary>
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/15">{nav}</div>
      </details>
    </>
  );
}
