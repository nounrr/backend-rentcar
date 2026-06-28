"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CalendarRange, Car, Clock, RefreshCcw, Search } from "lucide-react"

import { DataTable } from "@/components/admin/data-table"
import { ListPageShell } from "@/components/admin/list-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGetReservationsQuery } from "@/store/api/reservations"
import type { AdminReservation, ReservationStatus } from "@/store/api/reservations"
import { useGetVehiclesQuery } from "@/store/api/vehicles"
import type { AdminVehicle } from "@/store/api/vehicles"

const BLOCKING_STATUSES: ReservationStatus[] = ["pending", "confirmed", "active"]

function formatAmount(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—"
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

type AvailabilityRow = {
  vehicle: AdminVehicle
  availableFromTime: string | null
}

export function VehicleAvailabilityPage() {
  const [startDate, setStartDate] = useState<string>(todayISO())
  const [endDate, setEndDate] = useState<string>(addDaysISO(todayISO(), 1))
  const [search, setSearch] = useState("")

  const { data: vehicles = [], isLoading: vehiclesLoading, isFetching: vehiclesFetching, refetch: refetchVehicles } =
    useGetVehiclesQuery()
  const { data: reservations = [], isLoading: resLoading, isFetching: resFetching, refetch: refetchReservations } =
    useGetReservationsQuery()

  const isInvalidRange =
    !startDate || !endDate || new Date(endDate).getTime() < new Date(startDate).getTime()

  const availability = useMemo<AvailabilityRow[]>(() => {
    if (isInvalidRange) return []
    const startMs = new Date(startDate).getTime()
    const endMs = new Date(endDate).getTime()

    return vehicles
      .map<AvailabilityRow | null>((vehicle) => {
        // Find blocking reservations overlapping the period
        const overlaps = reservations.filter((r: AdminReservation) => {
          if (Number(r.vehicle_id) !== Number(vehicle.id)) return false
          if (!BLOCKING_STATUSES.includes(r.reservation_status)) return false
          const rStart = new Date(r.start_date).getTime()
          const rEnd = new Date(r.end_date).getTime()
          if (Number.isNaN(rStart) || Number.isNaN(rEnd)) return false
          return rStart <= endMs && rEnd >= startMs
        })

        if (overlaps.length === 0) {
          return { vehicle, availableFromTime: null }
        }

        // If the only overlap is a reservation that returns on startDate
        // (same day), surface the return time as "available from".
        const onlyReturningSameDay = overlaps.every((r) => {
          const rEndIso = new Date(r.end_date).toISOString().slice(0, 10)
          return rEndIso === startDate && Boolean(r.return_time)
        })

        if (onlyReturningSameDay) {
          // Pick the latest return_time across overlapping reservations
          const latestReturn = overlaps
            .map((r) => r.return_time as string)
            .sort()
            .pop() ?? null
          return { vehicle, availableFromTime: latestReturn }
        }

        return null
      })
      .filter((row): row is AvailabilityRow => row !== null)
  }, [vehicles, reservations, startDate, endDate, isInvalidRange])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return availability
    return availability.filter(({ vehicle }) =>
      [vehicle.brand, vehicle.model, vehicle.registration_number, vehicle.color]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    )
  }, [availability, search])

  const isLoading = vehiclesLoading || resLoading
  const isFetching = vehiclesFetching || resFetching

  const columns: ColumnDef<AvailabilityRow>[] = useMemo(
    () => [
      {
        id: "vehicle",
        header: "Vehicule",
        cell: ({ row }) => {
          const v = row.original.vehicle
          return (
            <div className="space-y-0.5">
              <p className="font-medium">
                {v.brand} {v.model}
              </p>
              <p className="font-mono text-xs text-muted-foreground">{v.registration_number}</p>
            </div>
          )
        },
      },
      {
        id: "year_color",
        header: "Annee / Couleur",
        cell: ({ row }) => {
          const v = row.original.vehicle
          return (
            <div className="text-sm">
              <p>{v.year}</p>
              <p className="text-muted-foreground">{v.color}</p>
            </div>
          )
        },
      },
      {
        id: "category",
        header: "Categorie",
        cell: ({ row }) => row.original.vehicle.category?.name ?? "—",
      },
      {
        id: "seats",
        header: "Places",
        cell: ({ row }) => row.original.vehicle.seats,
      },
      {
        id: "price",
        header: "Prix / jour",
        cell: ({ row }) => formatAmount(row.original.vehicle.daily_rental_price),
      },
      {
        id: "availability",
        header: "Disponibilite",
        cell: ({ row }) => {
          const t = row.original.availableFromTime
          if (!t) {
            return (
              <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                Disponible
              </Badge>
            )
          }
          return (
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
                <Clock className="mr-1 size-3" />
                Disponible des {t.slice(0, 5)}
              </Badge>
            </div>
          )
        },
      },
    ],
    []
  )

  const totalDays = useMemo(() => {
    if (isInvalidRange) return 0
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime()
    return Math.max(1, Math.ceil(ms / 86400000))
  }, [startDate, endDate, isInvalidRange])

  return (
    <ListPageShell
      badge="Flotte"
      title="Vehicules disponibles"
      description="Selectionnez une periode pour voir les vehicules disponibles. L'heure n'est pas requise; elle s'affiche dans la colonne de disponibilite lorsqu'un vehicule revient le jour meme."
      action={
        <Button
          variant="outline"
          onClick={() => {
            refetchVehicles()
            refetchReservations()
          }}
          disabled={isFetching}
        >
          <RefreshCcw className={isFetching ? "size-4 animate-spin" : "size-4"} />
          Actualiser
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="size-4 text-primary" />
            Periode de disponibilite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date de debut *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date de fin *</label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Marque, modele, immatriculation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          {isInvalidRange ? (
            <p className="text-sm text-destructive">La date de fin doit etre posterieure ou egale a la date de debut.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {totalDays} jour{totalDays > 1 ? "s" : ""} - {filtered.length} vehicule
              {filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="size-4 text-primary" />
            Resultats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              emptyMessage={
                isInvalidRange
                  ? "Selectionnez une periode valide."
                  : "Aucun vehicule disponible pour cette periode."
              }
            />
          )}
        </CardContent>
      </Card>
    </ListPageShell>
  )
}
