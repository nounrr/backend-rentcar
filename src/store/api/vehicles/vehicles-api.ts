import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  AdminVehicle,
  BulkDeleteResponse,
  BulkDeleteVehicleCategoriesRequest,
  BulkDeleteVehiclesRequest,
  BulkStatusResponse,
  BulkStatusVehiclesRequest,
  DeleteResponse,
  ListVehicleCategoriesQueryParams,
  ListVehiclesQueryParams,
  VehicleCategory,
  VehicleCategoryFormRequest,
  VehicleCategoryId,
  VehicleCategoryResponse,
  VehicleFormRequest,
  VehicleId,
  VehicleMileageHistory,
  VehicleResponse,
} from "./types"

const VEHICLES_LIST_TAG = { type: "Vehicles" as const, id: "LIST" }
const VEHICLE_CATEGORIES_LIST_TAG = { type: "VehicleCategories" as const, id: "LIST" }

function buildQuery(base: string, params?: object) {
  if (!params) return base
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `${base}?${queryString}` : base
}

function vehicleFormData(payload: VehicleFormRequest) {
  const formData = new FormData()
  const scalarKeys: Array<keyof VehicleFormRequest> = [
    "registration_number",
    "brand",
    "model",
    "year",
    "vehicle_category_id",
    "color",
    "seats",
    "fuel_type",
    "transmission",
    "current_mileage",
    "oil_change_interval_km",
    "last_oil_change_km",
    "last_oil_change_at",
    "daily_rental_price",
    "deposit_amount",
    "status",
    "is_subcontracted",
    "subcontract_start_date",
    "subcontract_end_date",
    "subcontract_daily_cost",
    "chassis_number",
    "insurance_expires_at",
    "technical_inspection_expires_at",
    "tax_vignette_expires_at",
  ]

  scalarKeys.forEach((key) => {
    const value = payload[key]
    if (value === undefined || value === null || value === "") return
    if (typeof value === "boolean") {
      formData.set(key, value ? "1" : "0")
      return
    }
    formData.set(key, String(value))
  })

  if (payload.remove_photos !== undefined) formData.set("remove_photos", payload.remove_photos ? "1" : "0")
  if (payload.remove_registration_card_document !== undefined) formData.set("remove_registration_card_document", payload.remove_registration_card_document ? "1" : "0")
  if (payload.remove_insurance_document !== undefined) formData.set("remove_insurance_document", payload.remove_insurance_document ? "1" : "0")
  payload.vehicle_photos?.forEach((file) => formData.append("vehicle_photos[]", file))
  if (payload.registration_card_document) formData.set("registration_card_document", payload.registration_card_document)
  if (payload.insurance_document) formData.set("insurance_document", payload.insurance_document)

  return formData
}

export const vehiclesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVehicleCategories: builder.query<VehicleCategory[], ListVehicleCategoriesQueryParams | void>({
      query: (params) => buildQuery(apiConfig.routes.admin.vehicleCategories, params ?? undefined),
      providesTags: (result) =>
        result
          ? [
              ...result.map((category) => ({ type: "VehicleCategories" as const, id: category.id })),
              VEHICLE_CATEGORIES_LIST_TAG,
            ]
          : [VEHICLE_CATEGORIES_LIST_TAG],
    }),
    createVehicleCategory: builder.mutation<VehicleCategoryResponse, VehicleCategoryFormRequest>({
      query: (body) => ({ url: apiConfig.routes.admin.vehicleCategories, method: "POST", body }),
      invalidatesTags: [VEHICLE_CATEGORIES_LIST_TAG],
    }),
    updateVehicleCategory: builder.mutation<VehicleCategoryResponse, { categoryId: VehicleCategoryId } & VehicleCategoryFormRequest>({
      query: ({ categoryId, ...body }) => ({ url: `${apiConfig.routes.admin.vehicleCategories}/${categoryId}`, method: "PUT", body }),
      invalidatesTags: [VEHICLE_CATEGORIES_LIST_TAG, VEHICLES_LIST_TAG],
    }),
    deleteVehicleCategory: builder.mutation<DeleteResponse, VehicleCategoryId>({
      query: (categoryId) => ({ url: `${apiConfig.routes.admin.vehicleCategories}/${categoryId}`, method: "DELETE" }),
      invalidatesTags: [VEHICLE_CATEGORIES_LIST_TAG],
    }),
    bulkDeleteVehicleCategories: builder.mutation<BulkDeleteResponse, BulkDeleteVehicleCategoriesRequest>({
      query: (body) => ({ url: `${apiConfig.routes.admin.vehicleCategories}/bulk-delete`, method: "DELETE", body }),
      invalidatesTags: [VEHICLE_CATEGORIES_LIST_TAG],
    }),
    getVehicles: builder.query<AdminVehicle[], ListVehiclesQueryParams | void>({
      query: (params) => buildQuery(apiConfig.routes.admin.vehicles, params ?? undefined),
      providesTags: (result) =>
        result
          ? [
              ...result.map((vehicle) => ({ type: "Vehicles" as const, id: vehicle.id })),
              VEHICLES_LIST_TAG,
            ]
          : [VEHICLES_LIST_TAG],
    }),
    getVehicleMileageHistory: builder.query<VehicleMileageHistory[], VehicleId>({
      query: (vehicleId) => `${apiConfig.routes.admin.vehicles}/${vehicleId}/mileage-history`,
      providesTags: (_result, _error, vehicleId) => [
        { type: "Vehicles" as const, id: vehicleId },
        VEHICLES_LIST_TAG,
      ],
    }),
    createVehicle: builder.mutation<VehicleResponse, VehicleFormRequest>({
      query: (payload) => ({ url: apiConfig.routes.admin.vehicles, method: "POST", body: vehicleFormData(payload) }),
      invalidatesTags: [VEHICLES_LIST_TAG],
    }),
    updateVehicle: builder.mutation<VehicleResponse, { vehicleId: VehicleId } & VehicleFormRequest>({
      query: ({ vehicleId, ...payload }) => ({ url: `${apiConfig.routes.admin.vehicles}/${vehicleId}`, method: "PUT", body: vehicleFormData(payload) }),
      invalidatesTags: [VEHICLES_LIST_TAG],
    }),
    deleteVehicle: builder.mutation<DeleteResponse, VehicleId>({
      query: (vehicleId) => ({ url: `${apiConfig.routes.admin.vehicles}/${vehicleId}`, method: "DELETE" }),
      invalidatesTags: [VEHICLES_LIST_TAG],
    }),
    bulkDeleteVehicles: builder.mutation<BulkDeleteResponse, BulkDeleteVehiclesRequest>({
      query: (body) => ({ url: `${apiConfig.routes.admin.vehicles}/bulk-delete`, method: "DELETE", body }),
      invalidatesTags: [VEHICLES_LIST_TAG],
    }),
    bulkUpdateVehicleStatus: builder.mutation<BulkStatusResponse, BulkStatusVehiclesRequest>({
      query: (body) => ({ url: `${apiConfig.routes.admin.vehicles}/bulk-status`, method: "PUT", body }),
      invalidatesTags: [VEHICLES_LIST_TAG],
    }),
  }),
})

export const {
  useBulkDeleteVehicleCategoriesMutation,
  useBulkDeleteVehiclesMutation,
  useBulkUpdateVehicleStatusMutation,
  useCreateVehicleCategoryMutation,
  useCreateVehicleMutation,
  useDeleteVehicleCategoryMutation,
  useDeleteVehicleMutation,
  useGetVehicleCategoriesQuery,
  useGetVehicleMileageHistoryQuery,
  useGetVehiclesQuery,
  useUpdateVehicleCategoryMutation,
  useUpdateVehicleMutation,
} = vehiclesApi
