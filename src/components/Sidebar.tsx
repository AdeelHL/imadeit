"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Item = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: boolean;
};

const ITEMS: Item[] = [
  {
    href: "/dashboard/posts",
    label: "My posts",
    icon: <IconGrid />,
    matchPrefix: true,
  },
  {
    href: "/new",
    label: "New post",
    icon: <IconPlus />,
  },
  {
    href: "/dashboard/settings",
    label: "Profile & account",
    icon: <IconUser />,
  },
];

export function Sidebar({
  user,
}: {
  user: { username: string; displayName: string | null };
}) {
  const pathname = usePathname();

  return (
    <aside className="md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:w-60 md:shrink-0 md:border-r md:border-stone-200 md:dark:border-stone-800">
      <div className="md:p-4">
        <div className="hidden border-b border-stone-200 px-2 pb-4 md:block dark:border-stone-800">
          <p className="font-serif text-base font-semibold text-stone-900 dark:text-stone-50">
            {user.displayName ?? `@${user.username}`}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            @{user.username}
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto whitespace-nowrap border-b border-stone-200 bg-stone-50/60 px-3 py-2 backdrop-blur md:mt-4 md:flex-col md:overflow-x-visible md:whitespace-normal md:border-b-0 md:bg-transparent md:px-0 md:py-0 dark:border-stone-800 dark:bg-stone-950/60 dark:md:bg-transparent">
          {ITEMS.map((item) => {
            const active = item.matchPrefix
              ? pathname?.startsWith(item.href)
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition " +
                  (active
                    ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                    : "text-stone-700 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800")
                }
              >
                <span aria-hidden className="flex h-4 w-4 items-center">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="hidden px-3 pt-6 text-[10px] uppercase tracking-wider text-stone-400 md:block dark:text-stone-500">
          More coming soon
        </p>
      </div>
    </aside>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}
