import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  AdminReservation,
  BulkDeleteReservationsRequest,
  BulkDeleteReservationsResponse,
  CompleteReservationRequest,
  DeleteReservationResponse,
  ListReservationsQueryParams,
  ReservationFormRequest,
  ReservationId,
  ReservationResponse,
  UpdateReservationStatusRequest,
} from "./types"

const RESERVATIONS_LIST_TAG = { type: "Reservations" as const, id: "LIST" }
const CUSTOMERS_LIST_TAG = { type: "Customers" as const, id: "LIST" }
const VEHICLES_LIST_TAG = { type: "Vehicles" as const, id: "LIST" }
const MAINTENANCE_TAG = { type: "Maintenance" as const, id: "LIST" }

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

function appendValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return
  if (value instanceof File) {
    formData.set(key, value)
    return
  }
  if (typeof value === "boolean") {
    formData.set(key, value ? "1" : "0")
    return
  }
  formData.set(key, String(value))
}

function buildReservationBody(payload: ReservationFormRequest) {
  const files = [
    payload.new_client?.driving_license_scan,
    payload.new_client?.driving_license_back_scan,
    payload.new_client?.identity_document_scan,
    payload.new_client?.identity_document_back_scan,
  ]

  if (!files.some(Boolean)) return payload

  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "new_client" || value === undefined || value === null) return
    appendValue(formData, key, value)
  })

  if (payload.new_client) {
    Object.entries(payload.new_client).forEach(([key, value]) => {
      appendValue(formData, `new_client[${key}]`, value)
    })
  }

  return formData
}

export const reservationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReservations: builder.query<AdminReservation[], ListReservationsQueryParams | void>({
      query: (params) => buildQuery(apiConfig.routes.admin.reservations, params ?? undefined),
      providesTags: (result) =>
        result
          ? [
              ...result.map((reservation) => ({ type: "Reservations" as const, id: reservation.id })),
              RESERVATIONS_LIST_TAG,
            ]
          : [RESERVATIONS_LIST_TAG],
    }),

    getReservation: builder.query<AdminReservation, ReservationId>({
      query: (id) => `${apiConfig.routes.admin.reservations}/${id}`,
      providesTags: (result, _error, id) =>
        result ? [{ type: "Reservations" as const, id }] : [],
    }),

    createReservation: builder.mutation<ReservationResponse, ReservationFormRequest>({
      query: (body) => ({
        url: apiConfig.routes.admin.reservations,
        method: "POST",
        body: buildReservationBody(body),
      }),
      invalidatesTags: [RESERVATIONS_LIST_TAG, CUSTOMERS_LIST_TAG],
    }),

    updateReservation: builder.mutation<ReservationResponse, { reservationId: ReservationId } & ReservationFormRequest>({
      query: ({ reservationId, ...body }) => ({
        url: `${apiConfig.routes.admin.reservations}/${reservationId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { reservationId }) => [
        { type: "Reservations" as const, id: reservationId },
        RESERVATIONS_LIST_TAG,
      ],
    }),

    updateReservationStatus: builder.mutation<ReservationResponse, { reservationId: ReservationId } & UpdateReservationStatusRequest>({
      query: ({ reservationId, ...body }) => ({
        url: `${apiConfig.routes.admin.reservations}/${reservationId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { reservationId }) => [
        { type: "Reservations" as const, id: reservationId },
        RESERVATIONS_LIST_TAG,
      ],
    }),

    completeReservation: builder.mutation<ReservationResponse, { reservationId: ReservationId } & CompleteReservationRequest>({
      query: ({ reservationId, ...body }) => ({
        url: `${apiConfig.routes.admin.reservations}/${reservationId}/complete`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { reservationId }) => [
        { type: "Reservations" as const, id: reservationId },
        RESERVATIONS_LIST_TAG,
        VEHICLES_LIST_TAG,
        MAINTENANCE_TAG,
      ],
    }),

    deleteReservation: builder.mutation<DeleteReservationResponse, ReservationId>({
      query: (id) => ({
        url: `${apiConfig.routes.admin.reservations}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [RESERVATIONS_LIST_TAG],
    }),

    bulkDeleteReservations: builder.mutation<BulkDeleteReservationsResponse, BulkDeleteReservationsRequest>({
      query: (body) => ({
        url: `${apiConfig.routes.admin.reservations}/bulk-delete`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: [RESERVATIONS_LIST_TAG],
    }),
  }),
})

export const {
  useGetReservationsQuery,
  useGetReservationQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useUpdateReservationStatusMutation,
  useCompleteReservationMutation,
  useDeleteReservationMutation,
  useBulkDeleteReservationsMutation,
} = reservationsApi
