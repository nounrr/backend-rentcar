"use client"

import { UsersPage } from "@/components/pages/UsersPage"
import { PageGuard } from "@/components/auth/permission-gate"
import { PERM_USERS_VIEW } from "@/lib/permissions"

export default function Users() {
  return (
    <PageGuard permission={PERM_USERS_VIEW} page="Utilisateurs">
      <UsersPage />
    </PageGuard>
  )
}
