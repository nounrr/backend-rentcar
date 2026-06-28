import type { VehicleId } from "@/store/api/vehicles/types"

export type OilChangeId = number | string

export type MaintenanceStatus = "ok" | "soon" | "overdue" | "unknown"

export interface OilChangeVehicle {
  id: VehicleId
  brand: string
  model: string
  registration_number: string
}

export interface OilChangeCreatedBy {
  id: number
  name: string
}

export interface OilChange {
  id: OilChangeId
  vehicle_id: VehicleId
  mileage_km: number
  performed_at: string
  cost: number | string | null
  reference: string | null
  notes: string | null
  created_by: number | null
  created_at: string
  updated_at: string
  vehicle?: OilChangeVehicle | null
  created_by_user?: OilChangeCreatedBy | null
}

export interface OilChangeFormRequest {
  vehicle_id: VehicleId
  mileage_km: number
  performed_at: string
  cost?: number
  reference?: string
  notes?: string
}

export interface MaintenanceOverviewRow {
  vehicle: OilChangeVehicle
  current_mileage: number
  oil_change_interval_km: number
  last_oil_change_km: number | null
  last_oil_change_at: string | null
  next_oil_change_km: number | null
  km_remaining: number | null
  status: MaintenanceStatus
}

export interface ListOilChangesQueryParams {
  vehicle_id?: VehicleId
}

export type OilChangeResponse = { message: string; oil_change: OilChange }
export type DeleteOilChangeResponse = { message: string }
