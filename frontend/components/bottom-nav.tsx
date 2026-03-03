"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, FileText, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/inbox", icon: Inbox },
  { href: "/drafts", icon: FileText },
  { href: "/history", icon: Clock },
  { href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-chief-border bg-chief-nav-bg/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-around py-3">
        {NAV_ITEMS.map(({ href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-1.5 px-5 py-1 transition-colors",
                isActive
                  ? "text-chief-accent"
                  : "text-chief-text-muted hover:text-chief-text-secondary"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
              {isActive && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-chief-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
