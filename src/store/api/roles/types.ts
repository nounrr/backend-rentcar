export type RoleId = number | string

export interface RolePermission {
  id: RoleId
  name: string
  guard_name?: string
}

export interface AdminRole {
  id: RoleId
  name: string
  guard_name?: string
  permissions?: RolePermission[]
  permissions_count?: number
  created_at?: string
  updated_at?: string
}

export interface ListRolesQueryParams {
  search?: string
  permission_name?: string
}

export interface CreateRoleRequest {
  name: string
  permission_names?: string[]
}

export interface UpdateRoleRequest {
  name: string
  permission_names?: string[]
}

export interface SyncRolePermissionsRequest {
  permission_names: string[]
}

export interface CreateRoleResponse {
  message: string
  role: AdminRole
}

export interface UpdateRoleResponse {
  message: string
  role: AdminRole
}

export interface SyncRolePermissionsResponse {
  message: string
  role: AdminRole
}

export interface DeleteRoleResponse {
  message: string
}
