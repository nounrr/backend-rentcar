"use client"

import { ReservationsPage } from "@/components/pages/ReservationsPage"
import { PageGuard } from "@/components/auth/permission-gate"
import {
  PERM_RESERVATIONS_CREATE,
  PERM_RESERVATIONS_DELETE,
  PERM_RESERVATIONS_EDIT,
  PERM_RESERVATIONS_VIEW,
} from "@/lib/permissions"

export default function Reservations() {
  return (
    <PageGuard
      anyPermission={[
        PERM_RESERVATIONS_VIEW,
        PERM_RESERVATIONS_CREATE,
        PERM_RESERVATIONS_EDIT,
        PERM_RESERVATIONS_DELETE,
      ]}
      page="Reservations"
    >
      <ReservationsPage />
    </PageGuard>
  )
}
