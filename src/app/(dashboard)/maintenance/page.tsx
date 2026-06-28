"use client"

import { MaintenancePage } from "@/components/pages/MaintenancePage"
import { PageGuard } from "@/components/auth/permission-gate"
import {
  PERM_VEHICLES_EDIT,
  PERM_VEHICLES_VIEW,
} from "@/lib/permissions"

export default function Maintenance() {
  return (
    <PageGuard
      anyPermission={[PERM_VEHICLES_VIEW, PERM_VEHICLES_EDIT]}
      page="Maintenance"
    >
      <MaintenancePage />
    </PageGuard>
  )
}
