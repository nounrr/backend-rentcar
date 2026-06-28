import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  DeleteMaintenanceRecordResponse,
  ListMaintenanceRecordsQueryParams,
  MaintenanceRecord,
  MaintenanceRecordFormRequest,
  MaintenanceRecordId,
  MaintenanceRecordResponse,
} from "./types"

const MAINTENANCE_RECORDS_TAG = { type: "MaintenanceRecords" as const, id: "LIST" }
const MAINTENANCE_TAG = { type: "Maintenance" as const, id: "LIST" }

function buildQuery(base: string, params?: object) {
  if (!params) return base
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") sp.set(key, String(value))
  })
  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}

export const maintenanceRecordsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaintenanceRecords: builder.query<MaintenanceRecord[], ListMaintenanceRecordsQueryParams | void>({
      query: (params) => buildQuery(apiConfig.routes.admin.maintenanceRecords, params ?? undefined),
      providesTags: (result) =>
        result
          ? [
              ...result.map((record) => ({ type: "MaintenanceRecords" as const, id: record.id })),
              MAINTENANCE_RECORDS_TAG,
            ]
          : [MAINTENANCE_RECORDS_TAG],
    }),

    createMaintenanceRecord: builder.mutation<MaintenanceRecordResponse, MaintenanceRecordFormRequest>({
      query: (body) => ({
        url: apiConfig.routes.admin.maintenanceRecords,
        method: "POST",
        body,
      }),
      invalidatesTags: [MAINTENANCE_RECORDS_TAG, MAINTENANCE_TAG],
    }),

    deleteMaintenanceRecord: builder.mutation<DeleteMaintenanceRecordResponse, MaintenanceRecordId>({
      query: (id) => ({
        url: `${apiConfig.routes.admin.maintenanceRecords}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [MAINTENANCE_RECORDS_TAG, MAINTENANCE_TAG],
    }),
  }),
})

export const {
  useGetMaintenanceRecordsQuery,
  useCreateMaintenanceRecordMutation,
  useDeleteMaintenanceRecordMutation,
} = maintenanceRecordsApi
