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
import { getStoredAccessToken, clearStoredAuth } from "@/lib/auth/client-token"
import { clearSession } from "@/store/slices/session-slice"

export const apiTagTypes = ["Auth", "Dashboard", "Users", "Roles", "Permissions", "Brands", "Categories", "Customers", "VehicleCategories", "Vehicles", "Reservations", "Documents", "OilChanges", "MaintenanceRecords", "Maintenance", "Settings"] as const

const rawBaseQuery = fetchBaseQuery({
  // En SPA statique, on appelle Laravel directement (plus de proxy /api Next).
  baseUrl: apiConfig.backendBaseUrl,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json")

    // Token Bearer (personal access token Sanctum) stocke cote navigateur.
    const token = getStoredAccessToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

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
    clearStoredAuth()
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
