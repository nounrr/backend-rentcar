export type BrandId = number | string

export interface AdminBrand {
  id: BrandId
  name: string
  description?: string | null
  image?: string | null
  image_url?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ListBrandsQueryParams {
  search?: string
  is_active?: boolean
  has_image?: boolean
  has_products?: boolean
  category_id?: number | string
}

export interface CreateBrandRequest {
  name: string
  description?: string | null
  image?: File | null
  is_active?: boolean
}

export interface UpdateBrandRequest {
  name: string
  description?: string | null
  image?: File | null
  is_active?: boolean
  remove_image?: boolean
}

export interface CreateBrandResponse {
  message: string
  brand: AdminBrand
}

export interface UpdateBrandResponse {
  message: string
  brand: AdminBrand
}

export interface DeleteBrandResponse {
  message: string
}

export interface BulkDeleteBrandsRequest {
  brand_ids: Array<number | string>
}

export interface BulkDeleteBrandsResponse {
  message: string
  deleted_count: number
}
