"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useGetReservationsQuery } from "@/store/api/reservations"
import { useGetVehiclesQuery } from "@/store/api/vehicles"

const chartConfig = {
  available: { label: "Disponibles", color: "var(--chart-1)" },
  rented:    { label: "Louees",      color: "var(--chart-2)" },
  unavailable: { label: "Indisponibles", color: "var(--chart-3)" },
}

export function FleetStatus() {
  const { data: vehicles = [] } = useGetVehiclesQuery()
  const { data: reservations = [] } = useGetReservationsQuery()

  const { rows, total } = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const todayEnd = todayStart + 86400000 - 1

    const busy = new Set<number>(
      reservations
        .filter((r) => ["confirmed", "active"].includes(r.reservation_status))
        .filter((r) => {
          const s = new Date(r.start_date).getTime()
          const e = new Date(r.end_date).getTime()
          return s <= todayEnd && e >= todayStart
        })
        .map((r) => Number(r.vehicle_id))
    )

    let available = 0
    let rented = 0
    let unavailable = 0

    for (const v of vehicles) {
      if (v.status && v.status !== "available" && v.status !== "active") {
        unavailable += 1
        continue
      }
      if (busy.has(Number(v.id))) rented += 1
      else available += 1
    }

    return {
      total: vehicles.length,
      rows: [
        { name: "available", label: "Disponibles", value: available, color: "var(--chart-1)" },
        { name: "rented", label: "Louees", value: rented, color: "var(--chart-2)" },
        { name: "unavailable", label: "Indisponibles", value: unavailable, color: "var(--chart-3)" },
      ],
    }
  }, [vehicles, reservations])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statut de la flotte</CardTitle>
        <CardDescription>Repartition des {total} vehicule{total > 1 ? "s" : ""} aujourd&apos;hui</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-44">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={rows} dataKey="value" nameKey="label" innerRadius={45} outerRadius={75} strokeWidth={2}>
                {rows.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="space-y-2">
            {rows.map((r) => {
              const pct = total > 0 ? (r.value / total) * 100 : 0
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: r.color }} />
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                    {r.value} · {pct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
