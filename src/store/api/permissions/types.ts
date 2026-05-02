export type PermissionId = number | string

export interface AdminPermission {
  id: PermissionId
  name: string
  guard_name?: string
  created_at?: string
  updated_at?: string
}

export interface ListPermissionsQueryParams {
  search?: string
  guard_name?: string
}

export interface CreatePermissionRequest {
  name: string
}

export interface UpdatePermissionRequest {
  name: string
}

export interface CreatePermissionResponse {
  message: string
  permission: AdminPermission
}

export interface UpdatePermissionResponse {
  message: string
  permission: AdminPermission
}

export interface DeletePermissionResponse {
  message: string
}
