import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"
import type { UserId } from "@/store/api/auth/types"

import type {
  AdminUser,
  BulkDeleteUsersRequest,
  BulkDeleteUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserResponse,
  ListUsersQueryParams,
  SyncUserAccessResponse,
  SyncUserPermissionsRequest,
  SyncUserRolesRequest,
  UpdateUserRequest,
  UpdateUserResponse,
} from "./types"

const USERS_LIST_TAG = { type: "Users" as const, id: "LIST" }

function buildUsersQuery(params?: ListUsersQueryParams) {
  if (!params) {
    return apiConfig.routes.admin.users
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
    ? `${apiConfig.routes.admin.users}?${queryString}`
    : apiConfig.routes.admin.users
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<AdminUser[], ListUsersQueryParams | void>({
      query: (params) => buildUsersQuery(params ?? undefined),
      providesTags: (result) =>
        result
          ? [
            ...result.map((user) => ({ type: "Users" as const, id: user.id })),
            USERS_LIST_TAG,
          ]
          : [USERS_LIST_TAG],
    }),
    getUser: builder.query<AdminUser, UserId>({
      query: (userId) => `${apiConfig.routes.admin.users}/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "Users" as const, id: userId },
      ],
    }),
    createUser: builder.mutation<CreateUserResponse, CreateUserRequest>({
      query: (payload) => ({
        url: apiConfig.routes.admin.users,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [USERS_LIST_TAG],
    }),
    deleteUser: builder.mutation<DeleteUserResponse, UserId>({
      query: (userId) => ({
        url: `${apiConfig.routes.admin.users}/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, userId) => [
        { type: "Users" as const, id: userId },
        USERS_LIST_TAG,
      ],
    }),
    bulkDeleteUsers: builder.mutation<BulkDeleteUsersResponse, BulkDeleteUsersRequest>({
      query: (payload) => ({
        url: `${apiConfig.routes.admin.users}/bulk-delete`,
        method: "DELETE",
        body: payload,
      }),
      invalidatesTags: [USERS_LIST_TAG],
    }),
    syncUserRoles: builder.mutation<
      SyncUserAccessResponse,
      { userId: UserId } & SyncUserRolesRequest
    >({
      query: ({ userId, ...payload }) => ({
        url: `${apiConfig.routes.admin.users}/${userId}/roles`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "Users" as const, id: userId },
        USERS_LIST_TAG,
      ],
    }),
    syncUserPermissions: builder.mutation<
      SyncUserAccessResponse,
      { userId: UserId } & SyncUserPermissionsRequest
    >({
      query: ({ userId, ...payload }) => ({
        url: `${apiConfig.routes.admin.users}/${userId}/permissions`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "Users" as const, id: userId },
        USERS_LIST_TAG,
      ],
    }),
    updateUser: builder.mutation<UpdateUserResponse, { userId: UserId } & UpdateUserRequest>({
      query: ({ userId, ...payload }) => ({
        url: `${apiConfig.routes.admin.users}/${userId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "Users" as const, id: userId },
        USERS_LIST_TAG,
      ],
    }),
  }),
})

export const {
  useBulkDeleteUsersMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUserQuery,
  useGetUsersQuery,
  useLazyGetUserQuery,
  useLazyGetUsersQuery,
  useSyncUserPermissionsMutation,
  useSyncUserRolesMutation,
  useUpdateUserMutation,
} = usersApi
