"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutPanelLeft,
  CalendarDays,
  Car,
  UserRound,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavTab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function TabButton({ tab, active }: { tab: NavTab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300",
          active
            ? "bg-primary/10 scale-110 shadow-[0_4px_14px_-4px_var(--brand)]"
            : "group-active:scale-95",
        )}
      >
        <Icon className={cn("h-5 w-5 transition-transform", active && "drop-shadow-sm")} />
        {active && (
          <span className="pointer-events-none absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--brand)]" />
        )}
      </span>
      <span className={cn("truncate transition-opacity", active ? "opacity-100" : "opacity-70")}>
        {tab.label}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("MobileNav");

  const leftTabs: NavTab[] = [
    { href: "/dashboard", label: t("home"), icon: LayoutPanelLeft },
    { href: "/reservations", label: t("reservations"), icon: CalendarDays },
  ];

  const rightTabs: NavTab[] = [
    { href: "/vehicles", label: t("vehicles"), icon: Car },
    { href: "/customers", label: t("customers"), icon: UserRound },
  ];

  const isActive = React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );

  const handleCreate = () => {
    router.push("/reservations?new=1");
  };

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none h-[calc(5.5rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <nav
        aria-label={t("home")}
        className={cn(
          "fixed inset-x-3 bottom-3 z-50 md:hidden",
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="relative">
          <div
            className={cn(
              "relative flex items-center justify-between gap-1 rounded-[28px] px-2 pt-2 pb-1",
              "bg-background/70 backdrop-blur-2xl backdrop-saturate-150",
              "border border-border/60",
              "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25),0_8px_20px_-8px_rgba(0,0,0,0.15)]",
              "before:pointer-events-none before:absolute before:inset-0 before:rounded-[28px]",
              "before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-60",
              "dark:before:from-white/5",
            )}
          >
            <div className="flex flex-1 items-center">
              {leftTabs.map((tab) => (
                <TabButton key={tab.href} tab={tab} active={isActive(tab.href)} />
              ))}
            </div>

            <div className="relative flex w-20 shrink-0 justify-center">
              <button
                type="button"
                onClick={handleCreate}
                aria-label={t("newReservation")}
                className={cn(
                  "group absolute -top-8 flex h-16 w-16 items-center justify-center rounded-full",
                  "bg-gradient-to-br from-[var(--brand)] to-[var(--brand-deep)]",
                  "text-primary-foreground",
                  "shadow-[0_12px_30px_-6px_var(--brand),0_0_0_4px_var(--background)]",
                  "ring-1 ring-white/20",
                  "transition-all duration-300 ease-out",
                  "hover:scale-105 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-primary/40 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 to-transparent opacity-60"
                />
                <Plus
                  className="relative h-7 w-7 transition-transform duration-300 group-hover:rotate-90"
                  strokeWidth={2.5}
                />
                <span
                  aria-hidden
                  className="absolute -inset-1 rounded-full border border-primary/30 animate-ping opacity-0 group-hover:opacity-40"
                />
              </button>
            </div>

            <div className="flex flex-1 items-center">
              {rightTabs.map((tab) => (
                <TabButton key={tab.href} tab={tab} active={isActive(tab.href)} />
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
