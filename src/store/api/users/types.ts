import type { UserId } from "@/store/api/auth/types"

export interface AdminUserRole {
  id: UserId
  name: string
  guard_name?: string
}

export interface AdminUserPermission {
  id: UserId
  name: string
  guard_name?: string
}

export interface AdminUser {
  id: UserId
  name: string
  username: string
  email: string
  phone: string | null
  cin: string | null
  job_title: string | null
  is_active: boolean
  roles: AdminUserRole[]
  permissions: AdminUserPermission[]
  created_at?: string
  updated_at?: string
}

export interface ListUsersQueryParams {
  search?: string
  role_name?: string
  permission_name?: string
  job_title?: string
  is_active?: boolean
}

export interface CreateUserRequest {
  name: string
  username: string
  email: string
  password: string
  password_confirmation: string
  phone?: string | null
  cin?: string | null
  job_title?: string | null
  is_active?: boolean
  role_names?: string[]
}

export interface CreateUserResponse {
  message: string
  user: AdminUser
}

export interface DeleteUserResponse {
  message: string
}

export interface BulkDeleteUsersRequest {
  user_ids: Array<number | string>
}

export interface BulkDeleteUsersResponse {
  message: string
  deleted_count: number
}

export interface SyncUserRolesRequest {
  role_names: string[]
}

export interface SyncUserPermissionsRequest {
  permission_names: string[]
}

export interface SyncUserAccessResponse {
  message: string
  user: AdminUser
}

export interface UpdateUserRequest {
  name?: string
  username?: string
  email?: string
  password?: string
  password_confirmation?: string
  phone?: string | null
  cin?: string | null
  job_title?: string | null
  is_active?: boolean
}

export interface UpdateUserResponse {
  message: string
  user: AdminUser
}
