import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"
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
} from "./types"

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signIn: builder.mutation<SignInResponse, SignInRequest>({
      query: (credentials) => ({
        url: apiConfig.routes.auth.signIn,
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "Dashboard", "Users"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled

          dispatch(
            setSession({
              user: data.user,
            })
          )
        } catch {
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
      providesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setCurrentUser(data))
        } catch {
          dispatch(clearSession())
        }
      },
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
} = authApi

export const usePrefetchCurrentUser = () =>
  authApi.usePrefetch("getCurrentUser")