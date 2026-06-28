"use client"

import * as React from "react"
import {
  FolderTree,
  KeyRound,
  LayoutPanelLeft,
  Car,
  CarFront,
  Wrench,
  UserRound,
  Tag,
  Users,
  CalendarDays,
  Receipt,
  FileText,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Logo } from "@/components/logo"

import { NavMain, type NavItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentUser } from "@/store/slices/session-slice"
import {
  PERM_BRANDS_MANAGE,
  PERM_BRANDS_VIEW,
  PERM_CATEGORIES_MANAGE,
  PERM_CATEGORIES_VIEW,
  PERM_CUSTOMERS_CREATE,
  PERM_CUSTOMERS_EDIT,
  PERM_CUSTOMERS_VIEW,
  PERM_DASHBOARD_VIEW,
  PERM_ROLES_MANAGE,
  PERM_ROLES_VIEW,
  PERM_USERS_VIEW,
  PERM_VEHICLE_CATEGORIES_MANAGE,
  PERM_VEHICLE_CATEGORIES_VIEW,
  PERM_VEHICLES_CREATE,
  PERM_VEHICLES_EDIT,
  PERM_VEHICLES_VIEW,
  PERM_RESERVATIONS_VIEW,
  PERM_RESERVATIONS_CREATE,
  PERM_RESERVATIONS_EDIT,
  PERM_RESERVATIONS_DELETE,
  PERM_PAYMENTS_VIEW,
  PERM_PAYMENTS_MANAGE,
} from "@/lib/permissions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useAppSelector(selectCurrentUser)
  const tNav = useTranslations("Nav")
  const tApp = useTranslations("App")

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: tNav("navigation"),
      items: [
        {
          title: tNav("dashboard"),
          url: "/dashboard",
          icon: LayoutPanelLeft,
          permission: PERM_DASHBOARD_VIEW,
        },
        {
          title: tNav("users"),
          url: "/users",
          icon: Users,
          permission: PERM_USERS_VIEW,
        },
        {
          title: tNav("customers"),
          url: "/customers",
          icon: UserRound,
          anyPermission: [PERM_CUSTOMERS_VIEW, PERM_CUSTOMERS_CREATE, PERM_CUSTOMERS_EDIT],
        },
        {
          title: tNav("reservations"),
          url: "/reservations",
          icon: CalendarDays,
          anyPermission: [
            PERM_RESERVATIONS_VIEW,
            PERM_RESERVATIONS_CREATE,
            PERM_RESERVATIONS_EDIT,
            PERM_RESERVATIONS_DELETE,
          ],
        },
        {
          title: tNav("availability"),
          url: "/vehicle-availability",
          icon: CarFront,
          anyPermission: [
            PERM_VEHICLES_VIEW,
            PERM_RESERVATIONS_VIEW,
            PERM_RESERVATIONS_CREATE,
          ],
        },
        {
          title: tNav("payments"),
          url: "/payments",
          icon: Receipt,
          anyPermission: [PERM_PAYMENTS_VIEW, PERM_PAYMENTS_MANAGE],
        },
        {
          title: tNav("documents"),
          url: "/documents",
          icon: FileText,
          permission: PERM_DASHBOARD_VIEW,
        },
        {
          title: tNav("vehicles"),
          url: "/vehicles",
          icon: Car,
          anyPermission: [
            PERM_VEHICLES_VIEW,
            PERM_VEHICLES_CREATE,
            PERM_VEHICLES_EDIT,
            PERM_VEHICLE_CATEGORIES_VIEW,
            PERM_VEHICLE_CATEGORIES_MANAGE,
          ],
        },
        {
          title: tNav("maintenance"),
          url: "/maintenance",
          icon: Wrench,
          anyPermission: [PERM_VEHICLES_VIEW, PERM_VEHICLES_EDIT],
        },
        {
          title: tNav("brands"),
          url: "/brands",
          icon: Tag,
          anyPermission: [PERM_BRANDS_VIEW, PERM_BRANDS_MANAGE],
        },
        {
          title: tNav("categories"),
          url: "/categories",
          icon: FolderTree,
          anyPermission: [
            PERM_CATEGORIES_VIEW,
            PERM_CATEGORIES_MANAGE,
            PERM_VEHICLE_CATEGORIES_VIEW,
            PERM_VEHICLE_CATEGORIES_MANAGE,
          ],
        },
        {
          title: tNav("roles"),
          url: "/roles-permissions",
          icon: KeyRound,
          anyPermission: [PERM_ROLES_VIEW, PERM_ROLES_MANAGE],
        },
        {
          title: tNav("settings"),
          url: "/settings",
          icon: Settings,
          permission: PERM_ROLES_MANAGE,
        },
      ],
    },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="brand-badge text-foreground flex aspect-square size-10 items-center justify-center rounded-xl">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{tApp("name")}</span>
                  <span className="text-primary truncate text-xs font-medium">{tApp("backOffice")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 pt-3">
        <NavUser
          user={{
            name: currentUser?.name ?? "smartLocation",
            email: currentUser?.email ?? "admin@smartlocation.local",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
