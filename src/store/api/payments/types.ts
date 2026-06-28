import type { ReservationId } from "@/store/api/reservations/types"

export type PaymentId = number | string

export type PaymentType = "deposit" | "partial" | "full" | "refund"
export type PaymentMethod = "cash" | "card" | "transfer" | "check"

export interface Payment {
  id: PaymentId
  reservation_id: ReservationId
  amount: number | string
  type: PaymentType
  method: PaymentMethod
  paid_at: string
  reference: string | null
  notes: string | null
  created_by: number | null
  created_at: string
  created_by_user?: { id: number; name: string } | null
}

export interface PaymentsSummary {
  total_amount: number
  total_paid: number
  total_refunded: number
  net_paid: number
  remaining: number
  payment_status: string
}

export interface PaymentsListResponse {
  payments: Payment[]
  summary: PaymentsSummary
}

export interface CreatePaymentRequest {
  amount: number
  type: PaymentType
  method: PaymentMethod
  paid_at: string
  reference?: string
  notes?: string
}

export interface PaymentWithReservation extends Payment {
  reservation?: {
    id: number
    total_amount: number | string
    reservation_status: string
    start_date: string
    end_date: string
    client?: { full_name: string; phone: string } | null
    vehicle?: { brand: string; model: string; registration_number: string } | null
  } | null
}

export interface GlobalPaymentsSummary {
  count: number
  total_in: number
  total_out: number
  net: number
}

export interface AllPaymentsResponse {
  payments: PaymentWithReservation[]
  global_summary: GlobalPaymentsSummary
}

export interface AllPaymentsQueryParams {
  search?: string
  type?: PaymentType
  method?: PaymentMethod
}

export interface UpdatePaymentRequest {
  amount?: number
  type?: PaymentType
  method?: PaymentMethod
  paid_at?: string
  reference?: string | null
  notes?: string | null
}

export type DeletePaymentResponse = { message: string; summary: PaymentsSummary }
export type CreatePaymentResponse = { message: string; payment: Payment; summary: PaymentsSummary }
export type UpdatePaymentResponse = { message: string; payment: Payment; summary: PaymentsSummary }
