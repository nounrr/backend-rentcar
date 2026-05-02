"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { usePermissions } from "@/hooks/use-permissions"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  /** Permission required to show this item. Omit = always visible. */
  permission?: string
  /** Any of these permissions can show this item. */
  anyPermission?: string[]
  items?: {
    title: string
    url: string
    isActive?: boolean
    permission?: string
    anyPermission?: string[]
  }[]
}

export function NavMain({
  label,
  items,
}: {
  label: string
  items: NavItem[]
}) {
  const { can } = usePermissions()
  const pathname = usePathname()

  // Check if any subitem is active to determine if parent should be open
  const shouldBeOpen = (item: NavItem) => {
    if (item.isActive) return true
    return item.items?.some((subItem) => pathname === subItem.url) || false
  }

  // Filter top-level items by permission
  const visibleItems = items.filter(
    (item) =>
      (!item.permission || can(item.permission)) &&
      (!item.anyPermission?.length || item.anyPermission.some((permission) => can(permission)))
  )

  if (visibleItems.length === 0) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={shouldBeOpen(item)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} className="cursor-pointer">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.filter(
                        (sub) =>
                          (!sub.permission || can(sub.permission)) &&
                          (!sub.anyPermission?.length ||
                            sub.anyPermission.some((permission) => can(permission)))
                      ).map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="cursor-pointer" isActive={pathname === subItem.url}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title} className="cursor-pointer" isActive={pathname === item.url}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
