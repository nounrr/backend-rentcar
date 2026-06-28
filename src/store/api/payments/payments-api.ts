import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  AllPaymentsQueryParams,
  AllPaymentsResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  DeletePaymentResponse,
  PaymentId,
  PaymentsListResponse,
  UpdatePaymentRequest,
  UpdatePaymentResponse,
} from "./types"
import type { ReservationId } from "@/store/api/reservations/types"

function paymentsPath(reservationId: ReservationId) {
  return `${apiConfig.routes.admin.reservations}/${reservationId}/payments`
}

function buildQuery(base: string, params?: object) {
  if (!params) return base
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPayments: builder.query<AllPaymentsResponse, AllPaymentsQueryParams | void>({
      query: (params) => buildQuery(apiConfig.routes.admin.payments, params ?? undefined),
      providesTags: [{ type: "Reservations" as const, id: "ALL-PAYMENTS" }],
    }),

    getPayments: builder.query<PaymentsListResponse, ReservationId>({
      query: (reservationId) => paymentsPath(reservationId),
      providesTags: (_result, _error, reservationId) => [
        { type: "Reservations" as const, id: `payments-${reservationId}` },
      ],
    }),

    createPayment: builder.mutation<CreatePaymentResponse, { reservationId: ReservationId } & CreatePaymentRequest>({
      query: ({ reservationId, ...body }) => ({
        url: paymentsPath(reservationId),
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { reservationId }) => [
        { type: "Reservations" as const, id: `payments-${reservationId}` },
        { type: "Reservations" as const, id: "LIST" },
        { type: "Reservations" as const, id: reservationId },
        { type: "Reservations" as const, id: "ALL-PAYMENTS" },
      ],
    }),

    updatePayment: builder.mutation<UpdatePaymentResponse, { reservationId: ReservationId; paymentId: PaymentId } & UpdatePaymentRequest>({
      query: ({ reservationId, paymentId, ...body }) => ({
        url: `${paymentsPath(reservationId)}/${paymentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { reservationId }) => [
        { type: "Reservations" as const, id: `payments-${reservationId}` },
        { type: "Reservations" as const, id: "LIST" },
        { type: "Reservations" as const, id: reservationId },
        { type: "Reservations" as const, id: "ALL-PAYMENTS" },
      ],
    }),

    deletePayment: builder.mutation<DeletePaymentResponse, { reservationId: ReservationId; paymentId: PaymentId }>({
      query: ({ reservationId, paymentId }) => ({
        url: `${paymentsPath(reservationId)}/${paymentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { reservationId }) => [
        { type: "Reservations" as const, id: `payments-${reservationId}` },
        { type: "Reservations" as const, id: "LIST" },
        { type: "Reservations" as const, id: reservationId },
        { type: "Reservations" as const, id: "ALL-PAYMENTS" },
      ],
    }),
  }),
})

export const {
  useGetAllPaymentsQuery,
  useGetPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} = paymentsApi
