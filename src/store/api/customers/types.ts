import type { UserId } from "@/store/api/auth/types"

export type CustomerId = number | string

export interface AdminCustomer {
  id: CustomerId
  full_name: string
  phone: string
  email: string
  address: string
  city: string
  nationality: string
  cin: string | null
  passport: string | null
  driving_license_number: string
  driving_license_issued_at: string
  driving_license_expires_at: string
  driving_license_scan_path?: string | null
  driving_license_back_scan_path?: string | null
  identity_document_scan_path?: string | null
  identity_document_back_scan_path?: string | null
  driving_license_scan_url?: string | null
  driving_license_back_scan_url?: string | null
  identity_document_scan_url?: string | null
  identity_document_back_scan_url?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ListCustomersQueryParams {
  search?: string
  is_active?: boolean
}

export interface CustomerFormRequest {
  full_name: string
  phone: string
  email: string
  address: string
  city: string
  nationality: string
  cin?: string | null
  passport?: string | null
  driving_license_number: string
  driving_license_issued_at: string
  driving_license_expires_at: string
  driving_license_scan?: File | null
  driving_license_back_scan?: File | null
  identity_document_scan?: File | null
  identity_document_back_scan?: File | null
  password?: string
  is_active?: boolean
  remove_driving_license_scan?: boolean
  remove_driving_license_back_scan?: boolean
  remove_identity_document_scan?: boolean
  remove_identity_document_back_scan?: boolean
}

export interface CreateCustomerResponse {
  message: string
  customer: AdminCustomer
}

export interface UpdateCustomerResponse {
  message: string
  customer: AdminCustomer
}

export interface DeleteCustomerResponse {
  message: string
}

export interface BulkDeleteCustomersRequest {
  customer_ids: UserId[]
}

export interface BulkDeleteCustomersResponse {
  message: string
  deleted_count: number
}

export interface BulkUpdateCustomerStatusRequest {
  customer_ids: UserId[]
  is_active: boolean
}

export interface BulkUpdateCustomerStatusResponse {
  message: string
  updated_count: number
}
