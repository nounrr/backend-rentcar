import { PageGuard } from "@/components/auth/permission-gate"
import { RolesPermissionsPage } from "@/components/pages/RolesPermissionsPage"
import {
  PERM_ROLES_MANAGE,
  PERM_ROLES_VIEW,
} from "@/lib/permissions"

export default function RolesPermissions() {
  return (
    <PageGuard
      anyPermission={[PERM_ROLES_VIEW, PERM_ROLES_MANAGE]}
      page="Roles"
    >
      <RolesPermissionsPage />
    </PageGuard>
  )
}
