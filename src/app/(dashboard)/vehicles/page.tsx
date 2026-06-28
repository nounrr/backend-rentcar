"use client"

import { VehiclesPage } from "@/components/pages/VehiclesPage"
import { PageGuard } from "@/components/auth/permission-gate"
import {
  PERM_VEHICLE_CATEGORIES_MANAGE,
  PERM_VEHICLE_CATEGORIES_VIEW,
  PERM_VEHICLES_CREATE,
  PERM_VEHICLES_EDIT,
  PERM_VEHICLES_VIEW,
} from "@/lib/permissions"

export default function Vehicles() {
  return (
    <PageGuard
      anyPermission={[
        PERM_VEHICLES_VIEW,
        PERM_VEHICLES_CREATE,
        PERM_VEHICLES_EDIT,
        PERM_VEHICLE_CATEGORIES_VIEW,
        PERM_VEHICLE_CATEGORIES_MANAGE,
      ]}
      page="Vehicules"
    >
      <VehiclesPage />
    </PageGuard>
  )
}
