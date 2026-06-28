"use client"

import { CustomersPage } from "@/components/pages/CustomersPage"
import { PageGuard } from "@/components/auth/permission-gate"
import {
  PERM_CUSTOMERS_CREATE,
  PERM_CUSTOMERS_EDIT,
  PERM_CUSTOMERS_VIEW,
} from "@/lib/permissions"

export default function Customers() {
  return (
    <PageGuard
      anyPermission={[PERM_CUSTOMERS_VIEW, PERM_CUSTOMERS_CREATE, PERM_CUSTOMERS_EDIT]}
      page="Clients"
    >
      <CustomersPage />
    </PageGuard>
  )
}
