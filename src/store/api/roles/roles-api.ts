import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"
import type { RoleId } from "@/store/api/roles/types"
import type {
  AdminRole,
  CreateRoleRequest,
  CreateRoleResponse,
  DeleteRoleResponse,
  ListRolesQueryParams,
  SyncRolePermissionsRequest,
  SyncRolePermissionsResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
} from "./types"

const ROLES_LIST_TAG = { type: "Roles" as const, id: "LIST" }

function buildRolesQuery(params?: ListRolesQueryParams) {
  if (!params) {
    return apiConfig.routes.admin.roles
  }

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()

  return queryString
    ? `${apiConfig.routes.admin.roles}?${queryString}`
    : apiConfig.routes.admin.roles
}

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<AdminRole[], ListRolesQueryParams | void>({
      query: (params) => buildRolesQuery(params ?? undefined),
      providesTags: (result) =>
        result
          ? [
            ...result.map((role) => ({ type: "Roles" as const, id: role.id })),
            ROLES_LIST_TAG,
          ]
          : [ROLES_LIST_TAG],
    }),
    getRole: builder.query<AdminRole, RoleId>({
      query: (roleId) => `${apiConfig.routes.admin.roles}/${roleId}`,
      providesTags: (_result, _error, roleId) => [
        { type: "Roles" as const, id: roleId },
      ],
    }),
    createRole: builder.mutation<CreateRoleResponse, CreateRoleRequest>({
      query: (payload) => ({
        url: apiConfig.routes.admin.roles,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [ROLES_LIST_TAG],
    }),
    updateRole: builder.mutation<UpdateRoleResponse, { roleId: RoleId } & UpdateRoleRequest>({
      query: ({ roleId, ...payload }) => ({
        url: `${apiConfig.routes.admin.roles}/${roleId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: "Roles" as const, id: roleId },
        ROLES_LIST_TAG,
      ],
    }),
    syncRolePermissions: builder.mutation<
      SyncRolePermissionsResponse,
      { roleId: RoleId } & SyncRolePermissionsRequest
    >({
      query: ({ roleId, ...payload }) => ({
        url: `${apiConfig.routes.admin.roles}/${roleId}/permissions`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: "Roles" as const, id: roleId },
        ROLES_LIST_TAG,
      ],
    }),
    deleteRole: builder.mutation<DeleteRoleResponse, RoleId>({
      query: (roleId) => ({
        url: `${apiConfig.routes.admin.roles}/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: [ROLES_LIST_TAG],
    }),
  }),
})

export const {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetRoleQuery,
  useGetRolesQuery,
  useLazyGetRoleQuery,
  useLazyGetRolesQuery,
  useSyncRolePermissionsMutation,
  useUpdateRoleMutation,
} = rolesApi
