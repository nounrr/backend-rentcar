"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight, Clock, Wrench } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetMaintenanceOverviewQuery } from "@/store/api/oil-changes"

function formatKm(n: number | null) {
  if (n === null) return "—"
  return `${n.toLocaleString("fr-FR")} km`
}

export function MaintenanceAlerts() {
  const { data: rows = [] } = useGetMaintenanceOverviewQuery()

  const overdue = rows.filter((r) => r.status === "overdue")
  const soon = rows.filter((r) => r.status === "soon")
  const alerts = [...overdue, ...soon].slice(0, 6)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="size-4 text-primary" />
            Vidanges a prevoir
          </CardTitle>
          <CardDescription>
            {overdue.length} en retard · {soon.length} bientot
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/maintenance">
            Voir tout <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune vidange a prevoir pour le moment
          </p>
        ) : (
          alerts.map((r) => {
            const isOverdue = r.status === "overdue"
            const Icon = isOverdue ? AlertTriangle : Clock
            const km = r.km_remaining
            const label = km === null ? "—" : km <= 0 ? `-${Math.abs(km).toLocaleString("fr-FR")} km` : `${km.toLocaleString("fr-FR")} km restants`
            return (
              <Link
                key={String(r.vehicle.id)}
                href="/maintenance"
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5 transition-colors hover:bg-accent/50"
              >
                <div
                  className={
                    isOverdue
                      ? "rounded-md bg-rose-500/15 p-2 text-rose-600 dark:text-rose-400"
                      : "rounded-md bg-amber-500/15 p-2 text-amber-600 dark:text-amber-400"
                  }
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.vehicle.brand} {r.vehicle.model}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {r.vehicle.registration_number}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Actuel : {formatKm(r.current_mileage)} · Prochaine : {formatKm(r.next_oil_change_km)}
                  </p>
                </div>
                <Badge
                  className={
                    isOverdue
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
                  }
                >
                  {label}
                </Badge>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
