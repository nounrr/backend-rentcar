import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"
import type { PermissionId } from "@/store/api/permissions/types"
import type {
  AdminPermission,
  CreatePermissionRequest,
  CreatePermissionResponse,
  DeletePermissionResponse,
  ListPermissionsQueryParams,
  UpdatePermissionRequest,
  UpdatePermissionResponse,
} from "./types"

const PERMISSIONS_LIST_TAG = { type: "Permissions" as const, id: "LIST" }

function buildPermissionsQuery(params?: ListPermissionsQueryParams) {
  if (!params) {
    return apiConfig.routes.admin.permissions
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
    ? `${apiConfig.routes.admin.permissions}?${queryString}`
    : apiConfig.routes.admin.permissions
}

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<AdminPermission[], ListPermissionsQueryParams | void>({
      query: (params) => buildPermissionsQuery(params ?? undefined),
      providesTags: (result) =>
        result
          ? [
            ...result.map((perm) => ({
              type: "Permissions" as const,
              id: perm.id,
            })),
            PERMISSIONS_LIST_TAG,
          ]
          : [PERMISSIONS_LIST_TAG],
    }),
    getPermission: builder.query<AdminPermission, PermissionId>({
      query: (permissionId) => `${apiConfig.routes.admin.permissions}/${permissionId}`,
      providesTags: (_result, _error, permissionId) => [
        { type: "Permissions" as const, id: permissionId },
      ],
    }),
    createPermission: builder.mutation<
      CreatePermissionResponse,
      CreatePermissionRequest
    >({
      query: (payload) => ({
        url: apiConfig.routes.admin.permissions,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [PERMISSIONS_LIST_TAG],
    }),
    updatePermission: builder.mutation<
      UpdatePermissionResponse,
      { permissionId: PermissionId } & UpdatePermissionRequest
    >({
      query: ({ permissionId, ...payload }) => ({
        url: `${apiConfig.routes.admin.permissions}/${permissionId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { permissionId }) => [
        { type: "Permissions" as const, id: permissionId },
        PERMISSIONS_LIST_TAG,
      ],
    }),
    deletePermission: builder.mutation<DeletePermissionResponse, PermissionId>({
      query: (permissionId) => ({
        url: `${apiConfig.routes.admin.permissions}/${permissionId}`,
        method: "DELETE",
      }),
      invalidatesTags: [PERMISSIONS_LIST_TAG],
    }),
  }),
})

export const {
  useCreatePermissionMutation,
  useDeletePermissionMutation,
  useGetPermissionQuery,
  useGetPermissionsQuery,
  useLazyGetPermissionQuery,
  useLazyGetPermissionsQuery,
  useUpdatePermissionMutation,
} = permissionsApi
