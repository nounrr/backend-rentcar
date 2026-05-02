import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react"
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query"

import { apiConfig } from "@/config/api"
import { clearSession } from "@/store/slices/session-slice"

export const apiTagTypes = ["Auth", "Dashboard", "Users", "Roles", "Permissions", "Brands", "Categories"] as const

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiConfig.internalBaseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json")

    return headers
  },
})

const baseQueryWithSession: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    api.dispatch(clearSession())
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithSession,
  tagTypes: apiTagTypes,
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
})
