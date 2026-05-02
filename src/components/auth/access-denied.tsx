"use client"

import { ArrowLeft, Lock, ShieldOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface AccessDeniedProps {
  /** Human-readable page name shown in the heading */
  page?: string
  /** Permission name(s) required, shown as code badges */
  requiredPermission?: string | string[]
  /** Custom description override */
  description?: string
  /** Whether to show the "Go back" button */
  showBack?: boolean
}

export function AccessDenied({
  page,
  requiredPermission,
  description,
  showBack = true,
}: AccessDeniedProps) {
  const router = useRouter()

  const perms = requiredPermission
    ? Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission]
    : []

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      {/* Icon */}
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl border border-rose-200/60 bg-rose-50/70 dark:border-rose-800/40 dark:bg-rose-950/30">
        <ShieldOff className="size-9 text-rose-500 dark:text-rose-400" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Acces refuse
      </h1>

      {/* Subtitle */}
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description ??
          (page
            ? `Vous n'avez pas les droits necessaires pour acceder a la page "${page}".`
            : "Vous n'avez pas les droits necessaires pour acceder a cette page.")}
      </p>

      {/* Permission badges */}
      {perms.length > 0 && (
        <>
          <Separator className="my-6 max-w-xs opacity-50" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              <Lock className="mr-1.5 inline size-3 align-[-1px]" />
              Permission{perms.length > 1 ? "s" : ""} requise{perms.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {perms.map((perm) => (
                <Badge
                  key={perm}
                  variant="outline"
                  className="rounded-full border-rose-300/60 bg-rose-50 font-mono text-[11px] text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  {perm}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      {showBack && (
        <div className="mt-8">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Retour
          </Button>
        </div>
      )}
    </div>
  )
}
