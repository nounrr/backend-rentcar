"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useGetReservationsQuery } from "@/store/api/reservations"

const chartConfig = {
  revenue: {
    label: "Revenus",
    color: "var(--chart-1)",
  },
}

const MONTH_LABELS_FR = ["Janv", "Fevr", "Mars", "Avr", "Mai", "Juin", "Juil", "Aout", "Sept", "Oct", "Nov", "Dec"]

export function RevenueTrend() {
  const { data: reservations = [] } = useGetReservationsQuery()

  const data = useMemo(() => {
    const now = new Date()
    const buckets: { key: string; label: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_LABELS_FR[d.getMonth()],
        revenue: 0,
      })
    }
    const bucketMap = new Map(buckets.map((b) => [b.key, b]))

    for (const r of reservations) {
      if (r.reservation_status === "cancelled") continue
      const d = new Date(r.start_date)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = bucketMap.get(key)
      if (bucket) bucket.revenue += Number(r.total_amount || 0)
    }

    return buckets
  }, [reservations])

  const total = data.reduce((s, b) => s + b.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenus mensuels</CardTitle>
        <CardDescription>
          {total > 0
            ? `Total 6 derniers mois : ${total.toLocaleString("fr-FR")} MAD`
            : "Aucun revenu enregistre sur la periode"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-4">
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
