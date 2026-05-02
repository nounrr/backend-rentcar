export type {
  AdminPermission,
  CreatePermissionRequest,
  CreatePermissionResponse,
  DeletePermissionResponse,
  ListPermissionsQueryParams,
  PermissionId,
  UpdatePermissionRequest,
  UpdatePermissionResponse,
} from "./types"
export {
  permissionsApi,
  useCreatePermissionMutation,
  useDeletePermissionMutation,
  useGetPermissionQuery,
  useGetPermissionsQuery,
  useLazyGetPermissionQuery,
  useLazyGetPermissionsQuery,
  useUpdatePermissionMutation,
} from "./permissions-api"
