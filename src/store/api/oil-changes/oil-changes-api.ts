import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  DeleteOilChangeResponse,
  ListOilChangesQueryParams,
  MaintenanceOverviewRow,
  OilChange,
  OilChangeFormRequest,
  OilChangeId,
  OilChangeResponse,
} from "./types"

const OIL_CHANGES_LIST_TAG = { type: "OilChanges" as const, id: "LIST" }
const MAINTENANCE_TAG = { type: "Maintenance" as const, id: "LIST" }
const VEHICLES_LIST_TAG = { type: "Vehicles" as const, id: "LIST" }

function buildQuery(base: string, params?: object) {
  if (!params) return base
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}

export const oilChangesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOilChanges: builder.query<OilChange[], ListOilChangesQueryParams | void>({
      query: (params) => buildQuery(apiConfig.routes.admin.oilChanges, params ?? undefined),
      providesTags: (result) =>
        result
          ? [
              ...result.map((oc) => ({ type: "OilChanges" as const, id: oc.id })),
              OIL_CHANGES_LIST_TAG,
            ]
          : [OIL_CHANGES_LIST_TAG],
    }),

    getMaintenanceOverview: builder.query<MaintenanceOverviewRow[], void>({
      query: () => apiConfig.routes.admin.maintenanceOverview,
      providesTags: [MAINTENANCE_TAG],
    }),

    createOilChange: builder.mutation<OilChangeResponse, OilChangeFormRequest>({
      query: (body) => ({
        url: apiConfig.routes.admin.oilChanges,
        method: "POST",
        body,
      }),
      invalidatesTags: [OIL_CHANGES_LIST_TAG, MAINTENANCE_TAG, VEHICLES_LIST_TAG],
    }),

    deleteOilChange: builder.mutation<DeleteOilChangeResponse, OilChangeId>({
      query: (id) => ({
        url: `${apiConfig.routes.admin.oilChanges}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [OIL_CHANGES_LIST_TAG, MAINTENANCE_TAG, VEHICLES_LIST_TAG],
    }),
  }),
})

export const {
  useGetOilChangesQuery,
  useGetMaintenanceOverviewQuery,
  useCreateOilChangeMutation,
  useDeleteOilChangeMutation,
} = oilChangesApi
