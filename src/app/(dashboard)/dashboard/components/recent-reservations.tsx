"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetReservationsQuery } from "@/store/api/reservations"
import type { ReservationStatus } from "@/store/api/reservations"

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  active: "En cours",
  completed: "Terminee",
  cancelled: "Annulee",
}

const STATUS_CLASS: Record<ReservationStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15",
  completed: "bg-violet-500/15 text-violet-700 dark:text-violet-300 hover:bg-violet-500/15",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15",
}

function formatDate(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

export function RecentReservations() {
  const { data: reservations = [] } = useGetReservationsQuery()

  const latest = useMemo(() => {
    return [...reservations]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
  }, [reservations])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Reservations recentes</CardTitle>
          <CardDescription>Les 6 dernieres creees</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/reservations">
            Voir tout <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune reservation
          </p>
        ) : (
          <div className="divide-y divide-border/70 -my-2">
            {latest.map((r) => (
              <Link
                key={String(r.id)}
                href="/reservations"
                className="flex items-center gap-3 py-3 transition-colors hover:bg-accent/30 -mx-2 px-2 rounded-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.client?.full_name ?? "—"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : "—"}
                    {r.vehicle?.registration_number ? ` · ${r.vehicle.registration_number}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{formatDate(r.start_date)} → {formatDate(r.end_date)}</p>
                  <p className="font-medium tabular-nums text-foreground">
                    {Number(r.total_amount || 0).toLocaleString("fr-FR")} MAD
                  </p>
                </div>
                <Badge className={STATUS_CLASS[r.reservation_status]}>
                  {STATUS_LABELS[r.reservation_status]}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
