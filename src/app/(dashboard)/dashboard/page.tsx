import Link from "next/link"
import { CalendarPlus, CarFront, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageGuard } from "@/components/auth/permission-gate"
import { PERM_DASHBOARD_VIEW } from "@/lib/permissions"

import { FleetStatus } from "./components/fleet-status"
import { DocumentExpirationAlerts } from "./components/document-expiration-alerts"
import { MaintenanceAlerts } from "./components/maintenance-alerts"
import { RecentReservations } from "./components/recent-reservations"
import { RentalKpis } from "./components/rental-kpis"
import { RevenueTrend } from "./components/revenue-trend"
import { TodayMovements } from "./components/today-movements"
import { TopVehicles } from "./components/top-vehicles"

export default function Dashboard() {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <PageGuard permission={PERM_DASHBOARD_VIEW} page="Tableau de bord">
      <div className="flex-1 space-y-6 px-4 pt-2 pb-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <span className="size-2 rounded-full bg-primary" />
              {today}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tableau de bord</h1>
            <p className="text-muted-foreground text-sm">
              Vue d&apos;ensemble de votre activite de location : revenus, flotte et mouvements du jour.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/vehicle-availability">
                <CarFront className="size-4" />
                Disponibilites
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/payments">
                <Receipt className="size-4" />
                Paiements
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/reservations?new=1">
                <CalendarPlus className="size-4" />
                Nouvelle reservation
              </Link>
            </Button>
          </div>
        </div>

        <div className="@container/main space-y-6">
          <RentalKpis />

          <div className="grid gap-6 @5xl:grid-cols-[2fr_1fr]">
            <RevenueTrend />
            <FleetStatus />
          </div>

          <TodayMovements />

          <div className="grid gap-6 @5xl:grid-cols-2">
            <MaintenanceAlerts />
            <DocumentExpirationAlerts />
          </div>

          <div className="grid gap-6 @5xl:grid-cols-2">
            <TopVehicles />
          </div>

          <RecentReservations />
        </div>
      </div>
    </PageGuard>
  )
}
