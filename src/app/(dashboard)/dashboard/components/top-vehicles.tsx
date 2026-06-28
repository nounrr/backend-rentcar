"use client"

import { useMemo } from "react"
import { Trophy } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetReservationsQuery } from "@/store/api/reservations"

function formatMAD(v: number) {
  return `${v.toLocaleString("fr-FR")} MAD`
}

export function TopVehicles() {
  const { data: reservations = [] } = useGetReservationsQuery()

  const top = useMemo(() => {
    const map = new Map<
      number,
      { label: string; plate: string; revenue: number; bookings: number }
    >()

    for (const r of reservations) {
      if (r.reservation_status === "cancelled") continue
      const vid = Number(r.vehicle_id)
      if (!vid) continue
      const label = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : `Vehicule #${vid}`
      const plate = r.vehicle?.registration_number ?? ""
      const existing = map.get(vid) ?? { label, plate, revenue: 0, bookings: 0 }
      existing.revenue += Number(r.total_amount || 0)
      existing.bookings += 1
      map.set(vid, existing)
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [reservations])

  const maxRevenue = top[0]?.revenue ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4 text-primary" />
          Top vehicules par revenus
        </CardTitle>
        <CardDescription>Cumul de tous les contrats non annules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
            Aucun revenu enregistre
          </p>
        ) : (
          top.map((v, i) => {
            const pct = maxRevenue > 0 ? (v.revenue / maxRevenue) * 100 : 0
            return (
              <div key={v.label + v.plate} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{v.label}</p>
                      <p className="font-mono text-xs text-muted-foreground">{v.plate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatMAD(v.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{v.bookings} loc.</p>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
