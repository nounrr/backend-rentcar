export type VehicleId = number | string
export type VehicleCategoryId = number | string

export interface VehicleCategory {
  id: VehicleCategoryId
  name: string
  description?: string | null
  is_active: boolean
  vehicles_count?: number
  created_at?: string
  updated_at?: string
}

export interface AdminVehicle {
  id: VehicleId
  registration_number: string
  brand: string
  model: string
  year: number
  vehicle_category_id: VehicleCategoryId
  category?: VehicleCategory | null
  color: string
  seats: number
  fuel_type: string
  transmission: string
  current_mileage: number
  oil_change_interval_km?: number | null
  last_oil_change_km?: number | null
  last_oil_change_at?: string | null
  daily_rental_price: string | number
  deposit_amount: string | number
  status: string
  is_subcontracted?: boolean
  subcontract_start_date?: string | null
  subcontract_end_date?: string | null
  subcontract_daily_cost?: number | string | null
  photos?: string[] | null
  photo_urls?: string[]
  chassis_number: string
  insurance_expires_at: string
  technical_inspection_expires_at: string
  tax_vignette_expires_at: string
  registration_card_document_path?: string | null
  insurance_document_path?: string | null
  registration_card_document_url?: string | null
  insurance_document_url?: string | null
  oil_change_status?: {
    next_oil_change_km: number | null
    km_remaining: number | null
    status: "ok" | "soon" | "overdue" | "unknown"
  }
  document_alerts?: VehicleDocumentAlert[]
  document_alert_status?: "ok" | "soon" | "overdue" | "unknown"
  created_at?: string
  updated_at?: string
}

export interface VehicleDocumentAlert {
  key: "insurance" | "technical_inspection" | "tax_vignette" | string
  label: string
  expires_at: string | null
  days_remaining: number | null
  alert_days?: number
  status: "ok" | "soon" | "overdue" | "unknown"
}

export interface VehicleMileageHistory {
  id: number
  vehicle_id: VehicleId
  reservation_id: number | string | null
  oil_change_id: number | string | null
  old_mileage_km: number
  new_mileage_km: number
  distance_km: number
  source: "vehicle_create" | "manual_update" | "reservation_return" | "oil_change" | string
  notes: string | null
  recorded_at: string
  created_at?: string
  reservation?: {
    id: number | string
    start_date: string | null
    end_date: string | null
    client?: {
      id: number | string
      full_name: string
    } | null
  } | null
  oil_change?: {
    id: number | string
    performed_at: string | null
    reference: string | null
  } | null
  created_by_user?: {
    id: number
    name: string
  } | null
}

export interface VehicleFormRequest {
  registration_number: string
  brand: string
  model: string
  year: number
  vehicle_category_id: VehicleCategoryId
  color: string
  seats: number
  fuel_type: string
  transmission: string
  current_mileage: number
  oil_change_interval_km?: number
  last_oil_change_km?: number | string | null
  last_oil_change_at?: string | null
  daily_rental_price: number
  deposit_amount: number
  status: string
  is_subcontracted?: boolean
  subcontract_start_date?: string | null
  subcontract_end_date?: string | null
  subcontract_daily_cost?: number | string | null
  vehicle_photos?: File[]
  chassis_number: string
  insurance_expires_at: string
  technical_inspection_expires_at: string
  tax_vignette_expires_at: string
  registration_card_document?: File | null
  insurance_document?: File | null
  remove_photos?: boolean
  remove_registration_card_document?: boolean
  remove_insurance_document?: boolean
}

export interface VehicleCategoryFormRequest {
  name: string
  description?: string | null
  is_active?: boolean
}

export interface ListVehiclesQueryParams {
  search?: string
  status?: string
  vehicle_category_id?: VehicleCategoryId
}

export interface ListVehicleCategoriesQueryParams {
  search?: string
  is_active?: boolean
}

export type VehicleResponse = { message: string; vehicle: AdminVehicle }
export type VehicleCategoryResponse = { message: string; category: VehicleCategory }
export type DeleteResponse = { message: string }
export type BulkDeleteVehiclesRequest = { vehicle_ids: VehicleId[] }
export type BulkDeleteVehicleCategoriesRequest = { category_ids: VehicleCategoryId[] }
export type BulkStatusVehiclesRequest = { vehicle_ids: VehicleId[]; status: string }
export type BulkDeleteResponse = { message: string; deleted_count: number }
export type BulkStatusResponse = { message: string; updated_count: number }
