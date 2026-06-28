"use client";

import React from "react";
import { useLocale } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { localeMeta, type Locale } from "@/i18n/config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale() as Locale;
  const sidebarSide = localeMeta[locale].dir === "rtl" ? "right" : "left";

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
    >
      <AppSidebar
        variant="inset"
        collapsible="offcanvas"
        side={sidebarSide}
      />
      <SidebarInset className="brand-shell overflow-hidden md:border md:border-border/60">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
