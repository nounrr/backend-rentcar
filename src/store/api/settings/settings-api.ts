import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  AlertSettings,
  UpdateAlertSettingsRequest,
  UpdateAlertSettingsResponse,
} from "./types"

const SETTINGS_TAG = { type: "Settings" as const, id: "ALERTS" }
const VEHICLES_LIST_TAG = { type: "Vehicles" as const, id: "LIST" }
const MAINTENANCE_TAG = { type: "Maintenance" as const, id: "LIST" }

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAlertSettings: builder.query<AlertSettings, void>({
      query: () => apiConfig.routes.admin.settings,
      providesTags: [SETTINGS_TAG],
    }),

    updateAlertSettings: builder.mutation<UpdateAlertSettingsResponse, UpdateAlertSettingsRequest>({
      query: (body) => ({
        url: apiConfig.routes.admin.settings,
        method: "PUT",
        body,
      }),
      invalidatesTags: [SETTINGS_TAG, VEHICLES_LIST_TAG, MAINTENANCE_TAG],
    }),
  }),
})

export const {
  useGetAlertSettingsQuery,
  useUpdateAlertSettingsMutation,
} = settingsApi
