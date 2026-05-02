import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ListPageShellProps = {
  badge?: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ListPageShell({
  badge,
  title,
  description,
  action,
  children,
  className,
}: ListPageShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-4 px-4 pb-6 md:px-6", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          {badge ? (
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {badge}
            </p>
          ) : null}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-muted-foreground max-w-3xl text-sm leading-6">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {action ? <div className="flex w-full md:w-auto">{action}</div> : null}
      </div>

      {children}
    </div>
  )
}