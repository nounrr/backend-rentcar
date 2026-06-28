import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"
import {
  clearStoredAuth,
  setStoredAuth,
  setStoredUser,
} from "@/lib/auth/client-token"
import { normalizeAuthenticatedUser } from "@/lib/auth/normalize-user"
import {
  clearSession,
  setCurrentUser,
  setSession,
} from "@/store/slices/session-slice"

import type {
  AuthenticatedUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  SignInRequest,
  SignInResponse,
  SignOutResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "./types"

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signIn: builder.mutation<SignInResponse, SignInRequest>({
      query: (credentials) => ({
        url: apiConfig.routes.auth.signIn,
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: { token?: string; message?: string; user?: unknown }) => ({
        token: response.token,
        message: response.message,
        user: normalizeAuthenticatedUser(response.user),
      }),
      invalidatesTags: ["Auth", "Dashboard", "Users"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled

          if (data.token) {
            setStoredAuth(data.token, data.user)
          }

          dispatch(setSession({ user: data.user }))
        } catch {
          clearStoredAuth()
          dispatch(clearSession())
        }
      },
    }),
    forgotPassword: builder.mutation<
      ForgotPasswordResponse,
      ForgotPasswordRequest
    >({
      query: (payload) => ({
        url: apiConfig.routes.auth.forgotPassword,
        method: "POST",
        body: payload,
      }),
    }),
    getCurrentUser: builder.query<AuthenticatedUser, void>({
      query: () => apiConfig.routes.auth.currentUser,
      transformResponse: (response: unknown) => normalizeAuthenticatedUser(response),
      providesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          setStoredUser(data)
          dispatch(setCurrentUser(data))
        } catch {
          clearStoredAuth()
          dispatch(clearSession())
        }
      },
    }),
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileRequest>({
      query: (payload) => ({
        url: apiConfig.routes.auth.updateProfile,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: { message?: string; user?: unknown }) => ({
        message: response.message ?? "",
        user: normalizeAuthenticatedUser(response.user),
      }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          setStoredUser(data.user)
          dispatch(setCurrentUser(data.user))
        } catch {
          // erreurs gérées par le composant appelant
        }
      },
    }),
    updatePassword: builder.mutation<UpdatePasswordResponse, UpdatePasswordRequest>({
      query: (payload) => ({
        url: apiConfig.routes.auth.updatePassword,
        method: "PUT",
        body: payload,
      }),
    }),
    signOut: builder.mutation<SignOutResponse, void>({
      query: () => ({
        url: apiConfig.routes.auth.signOut,
        method: "POST",
      }),
      invalidatesTags: ["Auth", "Dashboard", "Users"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          clearStoredAuth()
          dispatch(clearSession())
          dispatch(baseApi.util.resetApiState())
        }
      },
    }),
  }),
})

export const {
  useForgotPasswordMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useSignInMutation,
  useSignOutMutation,
  useUpdatePasswordMutation,
  useUpdateProfileMutation,
} = authApi

export const usePrefetchCurrentUser = () =>
  authApi.usePrefetch("getCurrentUser")
