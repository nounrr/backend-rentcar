"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetReservationsQuery } from "@/store/api/reservations"
import type { AdminReservation } from "@/store/api/reservations"

function isSameDayISO(iso: string, ref: Date) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

function MovementRow({
  reservation,
  variant,
}: {
  reservation: AdminReservation
  variant: "pickup" | "return"
}) {
  const time =
    variant === "pickup" ? reservation.pickup_time : reservation.return_time
  return (
    <Link
      href="/reservations"
      className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5 transition-colors hover:bg-accent/50"
    >
      <div
        className={
          variant === "pickup"
            ? "rounded-md bg-emerald-500/15 p-2 text-emerald-600 dark:text-emerald-400"
            : "rounded-md bg-amber-500/15 p-2 text-amber-600 dark:text-amber-400"
        }
      >
        {variant === "pickup" ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {reservation.vehicle
            ? `${reservation.vehicle.brand} ${reservation.vehicle.model}`
            : "Vehicule"}
          {reservation.vehicle?.registration_number ? (
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {reservation.vehicle.registration_number}
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {reservation.client?.full_name ?? "—"}
          {reservation.client?.phone ? ` · ${reservation.client.phone}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
        <Clock className="size-3" />
        {time ? time.slice(0, 5) : "—"}
      </div>
    </Link>
  )
}

export function TodayMovements() {
  const { data: reservations = [] } = useGetReservationsQuery()

  const { pickups, returns } = useMemo(() => {
    const now = new Date()
    const pickups = reservations
      .filter((r) => r.reservation_status !== "cancelled")
      .filter((r) => isSameDayISO(r.start_date, now))
      .sort((a, b) => (a.pickup_time ?? "").localeCompare(b.pickup_time ?? ""))
    const returns = reservations
      .filter((r) => r.reservation_status !== "cancelled")
      .filter((r) => isSameDayISO(r.end_date, now))
      .sort((a, b) => (a.return_time ?? "").localeCompare(b.return_time ?? ""))
    return { pickups, returns }
  }, [reservations])

  return (
    <div className="grid gap-4 @5xl:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Departs aujourd&apos;hui</CardTitle>
            <CardDescription>Prises en charge prevues ce jour</CardDescription>
          </div>
          <Badge variant="outline">{pickups.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {pickups.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
              Aucun depart prevu aujourd&apos;hui
            </p>
          ) : (
            pickups.slice(0, 6).map((r) => (
              <MovementRow key={String(r.id)} reservation={r} variant="pickup" />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Retours aujourd&apos;hui</CardTitle>
            <CardDescription>Restitutions prevues ce jour</CardDescription>
          </div>
          <Badge variant="outline">{returns.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {returns.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
              Aucun retour prevu aujourd&apos;hui
            </p>
          ) : (
            returns.slice(0, 6).map((r) => (
              <MovementRow key={String(r.id)} reservation={r} variant="return" />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
