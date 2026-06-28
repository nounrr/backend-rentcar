"use client"

import { PageGuard } from "@/components/auth/permission-gate"
import { SettingsPage } from "@/components/pages/SettingsPage"
import { PERM_ROLES_MANAGE } from "@/lib/permissions"

export default function Settings() {
  return (
    <PageGuard permission={PERM_ROLES_MANAGE} page="Parametres">
      <SettingsPage />
    </PageGuard>
  )
}
