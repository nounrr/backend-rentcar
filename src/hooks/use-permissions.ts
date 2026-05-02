"use client"

import { useEffect, useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentUser } from "@/store/slices/session-slice"
import { BYPASS_ROLES } from "@/lib/permissions"

/**
 * Core permission-checking hook.
 *
 * Bypass rule: any user whose `roles` array contains "admin" or "super-admin"
 * automatically passes every permission check — they are not restricted by
 * individual permission strings.
 *
 * Usage:
 *   const { can, hasRole, isSuperAdmin } = usePermissions()
 *   if (can("users.view")) { ... }
 */
export function usePermissions() {
  const user = useAppSelector(selectCurrentUser)

  const roles: string[] = useMemo(() => user?.roles ?? [], [user?.roles])
  const permissions: string[] = useMemo(
    () => user?.permissions ?? [],
    [user?.permissions]
  )

  // Debug: log roles & permissions whenever they change
  useEffect(() => {
    console.group("[usePermissions] Session state")
    console.log("User:", user?.name, `<${user?.email}>`)
    console.log("Roles:", roles)
    console.log("Permissions:", permissions)
    console.groupEnd()
  }, [user, roles, permissions])

  const isSuperAdmin = useMemo(
    () => BYPASS_ROLES.some((bypassRole) => roles.includes(bypassRole)),
    [roles]
  )

  /**
   * Check a single permission.
   * Super-admins always return true.
   */
  const can = useMemo(
    () =>
      (permission: string): boolean => {
        if (isSuperAdmin) return true
        return permissions.includes(permission)
      },
    [isSuperAdmin, permissions]
  )

  /**
   * Check if the user has at least one of the given permissions.
   * Super-admins always return true.
   */
  const canAny = useMemo(
    () =>
      (permissionList: string[]): boolean => {
        if (isSuperAdmin) return true
        return permissionList.some((p) => permissions.includes(p))
      },
    [isSuperAdmin, permissions]
  )

  /**
   * Check if the user has ALL of the given permissions.
   * Super-admins always return true.
   */
  const canAll = useMemo(
    () =>
      (permissionList: string[]): boolean => {
        if (isSuperAdmin) return true
        return permissionList.every((p) => permissions.includes(p))
      },
    [isSuperAdmin, permissions]
  )

  /**
   * Check if the user has a specific role (exact match, no bypass logic).
   */
  const hasRole = useMemo(
    () =>
      (role: string): boolean =>
        roles.includes(role),
    [roles]
  )

  /**
   * Check if the user has at least one of the given roles.
   */
  const hasAnyRole = useMemo(
    () =>
      (roleList: string[]): boolean =>
        roleList.some((r) => roles.includes(r)),
    [roles]
  )

  return {
    user,
    roles,
    permissions,
    isSuperAdmin,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
  }
}
