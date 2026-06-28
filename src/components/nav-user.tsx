"use client"

import {
  EllipsisVertical,
  LogOut,
  UserRound,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import * as React from "react"
import { toast } from "sonner"

import { signOutAction } from "@/actions/auth-actions"
import { Logo } from "@/components/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const t = useTranslations("UserMenu")
  const [isPending, startTransition] = React.useTransition()

  const handleSignOut = React.useCallback(() => {
    startTransition(async () => {
      const result = await signOutAction()

      if (result.status === "error") {
        toast.error(result.message ?? t("signOut"))
        return
      }

      router.replace("/sign-in")
      router.refresh()
    })
  }, [router, t])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="brand-badge text-foreground flex h-9 w-9 items-center justify-center rounded-lg">
                <Logo size={24} />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <EllipsisVertical className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <div className="brand-badge text-foreground flex h-9 w-9 items-center justify-center rounded-lg">
                  <Logo size={24} />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/profile")}>
              <UserRound />
              {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onSelect={handleSignOut}>
              <LogOut />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
