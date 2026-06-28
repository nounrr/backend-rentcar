import type { CustomerId } from "@/store/api/customers/types"
import type { PaymentMethod } from "@/store/api/payments/types"
import type { VehicleId } from "@/store/api/vehicles/types"

export type ReservationId = number | string

export type ReservationStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled"
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded"

export interface ReservationClient {
  id: CustomerId
  full_name: string
  phone: string
  email: string
  cin: string | null
}

export interface ReservationVehicle {
  id: VehicleId
  registration_number: string
  brand: string
  model: string
  year: number
  color: string
  current_mileage: number
  daily_rental_price: number | string
  is_subcontracted?: boolean
  subcontract_start_date?: string | null
  subcontract_end_date?: string | null
  subcontract_daily_cost?: number | string | null
}

export interface ReservationCreatedBy {
  id: number
  name: string
}

export interface ReservationPaymentsSummary {
  total_paid: number
  total_refunded: number
  net_paid: number
  remaining: number
  count: number
}

export interface AdminReservation {
  id: ReservationId
  client_id: CustomerId
  vehicle_id: VehicleId
  start_date: string
  end_date: string
  pickup_time: string | null
  return_time: string | null
  pickup_location: string | null
  return_location: string | null
  start_mileage_km: number | null
  return_mileage_km: number | null
  driven_mileage_km: number | null
  total_days: number
  price_per_day: number | string
  total_amount: number | string
  subcontract_daily_cost?: number | string
  subcontract_total_cost?: number
  estimated_profit?: number
  deposit_amount: number | string
  guarantee_amount: number | string
  guarantee_payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  reservation_status: ReservationStatus
  notes: string | null
  created_by: number | null
  created_at: string
  updated_at: string
  payments_summary?: ReservationPaymentsSummary
  client?: ReservationClient
  vehicle?: ReservationVehicle
  created_by_user?: ReservationCreatedBy | null
}

export interface NewClientPayload {
  full_name: string
  phone: string
  email?: string
  address?: string
  city?: string
  nationality?: string
  cin?: string
  passport?: string
  driving_license_number?: string
  driving_license_issued_at?: string
  driving_license_expires_at?: string
  driving_license_scan?: File | null
  driving_license_back_scan?: File | null
  identity_document_scan?: File | null
  identity_document_back_scan?: File | null
  password?: string
  is_active?: boolean
}

export interface ReservationFormRequest {
  client_id?: CustomerId
  new_client?: NewClientPayload
  vehicle_id: VehicleId
  start_date: string
  end_date: string
  pickup_time?: string
  return_time?: string
  pickup_location?: string
  return_location?: string
  price_per_day: number
  deposit_amount?: number
  deposit_payment_method?: PaymentMethod
  guarantee_amount?: number
  guarantee_payment_method?: PaymentMethod
  payment_status?: PaymentStatus
  reservation_status?: ReservationStatus
  notes?: string
}

export interface UpdateReservationStatusRequest {
  reservation_status: ReservationStatus
}

export interface CompleteReservationRequest {
  return_mileage_km: number
  return_notes?: string
}

export interface ListReservationsQueryParams {
  search?: string
  reservation_status?: ReservationStatus
  payment_status?: PaymentStatus
  start_date?: string
  end_date?: string
}

export type ReservationResponse = { message: string; reservation: AdminReservation }
export type DeleteReservationResponse = { message: string }
export type BulkDeleteReservationsRequest = { reservation_ids: ReservationId[] }
export type BulkDeleteReservationsResponse = { message: string; deleted_count: number }
