"use client"

import { useMemo } from "react"
import {
  CalendarCheck,
  CarFront,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetReservationsQuery } from "@/store/api/reservations"
import type { AdminReservation } from "@/store/api/reservations"
import { useGetVehiclesQuery } from "@/store/api/vehicles"

function formatMAD(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MAD`
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isWithin(date: Date, start: Date, end: Date) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
}

function reservationOverlaps(r: AdminReservation, start: Date, end: Date) {
  const rs = new Date(r.start_date).getTime()
  const re = new Date(r.end_date).getTime()
  if (Number.isNaN(rs) || Number.isNaN(re)) return false
  return rs <= end.getTime() && re >= start.getTime()
}

export function RentalKpis() {
  const { data: reservations = [], isLoading: rLoading } = useGetReservationsQuery()
  const { data: vehicles = [], isLoading: vLoading } = useGetVehiclesQuery()

  const kpis = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    // Revenue: total_amount of reservations whose start_date is in the month (excl. cancelled)
    const revenueThisMonth = reservations
      .filter((r) => r.reservation_status !== "cancelled")
      .filter((r) => isWithin(new Date(r.start_date), monthStart, monthEnd))
      .reduce((sum, r) => sum + Number(r.total_amount || 0), 0)

    const revenuePrevMonth = reservations
      .filter((r) => r.reservation_status !== "cancelled")
      .filter((r) => isWithin(new Date(r.start_date), prevMonthStart, prevMonthEnd))
      .reduce((sum, r) => sum + Number(r.total_amount || 0), 0)

    const revenueChange =
      revenuePrevMonth > 0
        ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100
        : revenueThisMonth > 0
          ? 100
          : 0

    // Active reservations (confirmed + active overlapping today)
    const activeReservations = reservations.filter(
      (r) =>
        (r.reservation_status === "active" || r.reservation_status === "confirmed") &&
        reservationOverlaps(r, todayStart, todayEnd)
    )

    // Fleet occupancy today
    const totalVehicles = vehicles.length
    const busyVehicleIds = new Set(
      reservations
        .filter((r) => ["pending", "confirmed", "active"].includes(r.reservation_status))
        .filter((r) => reservationOverlaps(r, todayStart, todayEnd))
        .map((r) => Number(r.vehicle_id))
    )
    const occupiedCount = busyVehicleIds.size
    const occupancyRate = totalVehicles > 0 ? (occupiedCount / totalVehicles) * 100 : 0

    // Outstanding payments: sum of payments_summary.remaining over non-cancelled
    const outstanding = reservations
      .filter((r) => r.reservation_status !== "cancelled")
      .reduce((sum, r) => sum + Number(r.payments_summary?.remaining ?? 0), 0)
    const outstandingCount = reservations
      .filter((r) => r.reservation_status !== "cancelled")
      .filter((r) => Number(r.payments_summary?.remaining ?? 0) > 0).length

    return {
      revenueThisMonth,
      revenueChange,
      activeReservations: activeReservations.length,
      occupiedCount,
      totalVehicles,
      occupancyRate,
      outstanding,
      outstandingCount,
    }
  }, [reservations, vehicles])

  const isLoading = rLoading || vLoading

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const TrendIcon = kpis.revenueChange >= 0 ? TrendingUp : TrendingDown
  const trendLabel = `${kpis.revenueChange >= 0 ? "+" : ""}${kpis.revenueChange.toFixed(1)}%`

  return (
    <div className="grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-primary" />
            Revenus du mois
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMAD(kpis.revenueThisMonth)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={kpis.revenueChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              <TrendIcon className="size-3.5" />
              {trendLabel}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">vs mois precedent</div>
          <div className="text-muted-foreground">Reservations non annulees demarrant ce mois</div>
        </CardFooter>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-primary" />
            Reservations en cours
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpis.activeReservations}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Aujourd&apos;hui</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">Locations actives</div>
          <div className="text-muted-foreground">Statut confirme ou actif chevauchant la date du jour</div>
        </CardFooter>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <CarFront className="size-4 text-primary" />
            Taux d&apos;occupation
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpis.occupancyRate.toFixed(0)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {kpis.occupiedCount}/{kpis.totalVehicles}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">Flotte aujourd&apos;hui</div>
          <div className="text-muted-foreground">Vehicules avec reservation chevauchant aujourd&apos;hui</div>
        </CardFooter>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            Paiements a recevoir
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMAD(kpis.outstanding)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{kpis.outstandingCount} dossiers</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="font-medium">Reste a percevoir</div>
          <div className="text-muted-foreground">Somme du restant sur reservations actives</div>
        </CardFooter>
      </Card>
    </div>
  )
}
