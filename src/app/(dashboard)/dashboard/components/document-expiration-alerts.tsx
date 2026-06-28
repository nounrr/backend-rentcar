"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight, CalendarClock, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetVehiclesQuery } from "@/store/api/vehicles"

function documentAlertText(days: number | null) {
  if (days === null) return "date inconnue"
  if (days < 0) return `expire depuis ${Math.abs(days)} j`
  if (days === 0) return "expire aujourd'hui"
  return `${days} j restants`
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

export function DocumentExpirationAlerts() {
  const { data: vehicles = [] } = useGetVehiclesQuery()

  const alerts = vehicles
    .flatMap((vehicle) =>
      (vehicle.document_alerts ?? [])
        .filter((alert) => alert.status === "soon" || alert.status === "overdue")
        .map((alert) => ({ vehicle, alert }))
    )
    .sort((a, b) => (a.alert.days_remaining ?? 9999) - (b.alert.days_remaining ?? 9999))

  const overdue = alerts.filter((item) => item.alert.status === "overdue")
  const soon = alerts.filter((item) => item.alert.status === "soon")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-primary" />
            Documents a surveiller
          </CardTitle>
          <CardDescription>
            {overdue.length} expire(s) - {soon.length} bientot
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/vehicles">
            Voir tout <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
            Aucun document proche de l&apos;expiration
          </p>
        ) : (
          alerts.slice(0, 6).map(({ vehicle, alert }) => {
            const isOverdue = alert.status === "overdue"
            const Icon = isOverdue ? AlertTriangle : Clock

            return (
              <Link
                key={`${vehicle.id}-${alert.key}`}
                href="/vehicles"
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
                    {alert.label} - {vehicle.brand} {vehicle.model}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {vehicle.registration_number}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Expiration : {formatDate(alert.expires_at)}
                  </p>
                </div>
                <Badge
                  className={
                    isOverdue
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
                  }
                >
                  {documentAlertText(alert.days_remaining)}
                </Badge>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
