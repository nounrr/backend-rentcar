import type { VehicleId } from "@/store/api/vehicles/types"

export type MaintenanceRecordId = number | string
export type MaintenanceRecordType = "accident" | "free"

export interface MaintenanceRecordVehicle {
  id: VehicleId
  brand: string
  model: string
  registration_number: string
}

export interface MaintenanceRecord {
  id: MaintenanceRecordId
  vehicle_id: VehicleId
  type: MaintenanceRecordType
  title: string
  performed_at: string
  mileage_km: number | null
  cost: number | string | null
  reference: string | null
  notes: string | null
  created_by: number | null
  created_at: string
  updated_at: string
  vehicle?: MaintenanceRecordVehicle | null
}

export interface MaintenanceRecordFormRequest {
  vehicle_id: VehicleId
  type: MaintenanceRecordType
  title: string
  performed_at: string
  mileage_km?: number
  cost?: number
  reference?: string
  notes?: string
}

export interface ListMaintenanceRecordsQueryParams {
  vehicle_id?: VehicleId
  type?: MaintenanceRecordType
}

export type MaintenanceRecordResponse = {
  message: string
  maintenance_record: MaintenanceRecord
}

export type DeleteMaintenanceRecordResponse = { message: string }
