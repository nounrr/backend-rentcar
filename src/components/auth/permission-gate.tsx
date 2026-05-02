"use client"

import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/auth/access-denied"

// ─────────────────────────────────────────────────────────────────────────────
// PermissionGate — inline conditional render
// ─────────────────────────────────────────────────────────────────────────────

interface PermissionGateProps {
  /** Single permission required. Super-admins bypass this. */
  permission?: string
  /** Any of these permissions suffices. */
  anyPermission?: string[]
  /** ALL of these permissions are required. */
  allPermissions?: string[]
  /** Role required (no bypass for roles — use for role-specific content). */
  role?: string
  /** Any of these roles suffices. */
  anyRole?: string[]
  /** What to render when access is denied. Defaults to null (renders nothing). */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Conditionally renders children based on the current user's permissions/roles.
 *
 * Examples:
 *   <PermissionGate permission="users.view">...</PermissionGate>
 *   <PermissionGate anyPermission={["users.edit", "users.manage-roles"]}>...</PermissionGate>
 *   <PermissionGate role="manager" fallback={<p>Rôle requis</p>}>...</PermissionGate>
 */
export function PermissionGate({
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions()

  let allowed = true

  if (permission) allowed = allowed && can(permission)
  if (anyPermission?.length) allowed = allowed && canAny(anyPermission)
  if (allPermissions?.length) allowed = allowed && canAll(allPermissions)
  if (role) allowed = allowed && hasRole(role)
  if (anyRole?.length) allowed = allowed && hasAnyRole(anyRole)

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// PageGuard — full-page permission protection with AccessDenied fallback
// ─────────────────────────────────────────────────────────────────────────────

interface PageGuardProps {
  /** Single permission required */
  permission?: string
  /** Any of these permissions suffices */
  anyPermission?: string[]
  /** Human-readable page name for the AccessDenied component */
  page?: string
  /** Custom description for the AccessDenied component */
  description?: string
  children: React.ReactNode
}

/**
 * Wraps a page component and shows <AccessDenied> if the user lacks the permission.
 *
 * Example in page.tsx:
 *   export default function Users() {
 *     return (
 *       <PageGuard permission="users.view" page="Utilisateurs">
 *         <UsersPage />
 *       </PageGuard>
 *     )
 *   }
 */
export function PageGuard({
  permission,
  anyPermission,
  page,
  description,
  children,
}: PageGuardProps) {
  const { can, canAny } = usePermissions()

  let allowed = true
  const requiredPerms: string[] = []

  if (permission) {
    requiredPerms.push(permission)
    allowed = allowed && can(permission)
  }

  if (anyPermission?.length) {
    requiredPerms.push(...anyPermission)
    allowed = allowed && canAny(anyPermission)
  }

  if (!allowed) {
    return (
      <AccessDenied
        page={page}
        requiredPermission={requiredPerms}
        description={description}
      />
    )
  }

  return <>{children}</>
}
