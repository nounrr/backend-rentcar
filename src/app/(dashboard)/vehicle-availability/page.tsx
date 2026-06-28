"use client"

import { VehicleAvailabilityPage } from "@/components/pages/VehicleAvailabilityPage"
import { PageGuard } from "@/components/auth/permission-gate"
import {
  PERM_RESERVATIONS_CREATE,
  PERM_RESERVATIONS_VIEW,
  PERM_VEHICLES_VIEW,
} from "@/lib/permissions"

export default function VehicleAvailability() {
  return (
    <PageGuard
      anyPermission={[PERM_VEHICLES_VIEW, PERM_RESERVATIONS_VIEW, PERM_RESERVATIONS_CREATE]}
      page="Disponibilites"
    >
      <VehicleAvailabilityPage />
    </PageGuard>
  )
}
