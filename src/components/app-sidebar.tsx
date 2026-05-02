"use client"

import * as React from "react"
import {
  FolderTree,
  KeyRound,
  LayoutPanelLeft,
  Tag,
  Users,
} from "lucide-react"
import Link from "next/link"
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
  PERM_DASHBOARD_VIEW,
  PERM_ROLES_MANAGE,
  PERM_ROLES_VIEW,
  PERM_USERS_VIEW,
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

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Navigation",
    items: [
      {
        title: "Tableau de bord",
        url: "/dashboard",
        icon: LayoutPanelLeft,
        permission: PERM_DASHBOARD_VIEW,
      },
      {
        title: "Utilisateurs",
        url: "/users",
        icon: Users,
        permission: PERM_USERS_VIEW,
      },
      {
        title: "Brands",
        url: "/brands",
        icon: Tag,
        anyPermission: [PERM_BRANDS_VIEW, PERM_BRANDS_MANAGE],
      },
      {
        title: "Categories",
        url: "/categories",
        icon: FolderTree,
        anyPermission: [PERM_CATEGORIES_VIEW, PERM_CATEGORIES_MANAGE],
      },
      {
        title: "Roles",
        url: "/roles-permissions",
        icon: KeyRound,
        anyPermission: [PERM_ROLES_VIEW, PERM_ROLES_MANAGE],
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useAppSelector(selectCurrentUser)

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
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Tanger Stylo</span>
                  <span className="text-primary truncate text-xs font-medium">Back-office</span>
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
            name: currentUser?.name ?? "Tanger Stylo",
            email: currentUser?.email ?? "admin@tanger-stylo.local",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
