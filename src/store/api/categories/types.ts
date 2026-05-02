export type CategoryId = number | string

export interface AdminCategory {
  id: CategoryId
  parent_id?: CategoryId | null
  name: string
  description?: string | null
  image?: string | null
  image_url?: string | null
  is_active: boolean
  parent?: AdminCategory | null
  children?: AdminCategory[]
  created_at?: string
  updated_at?: string
}

export interface ListCategoriesQueryParams {
  search?: string
  parent_id?: number | string | "null"
  is_active?: boolean
  is_root?: boolean
  has_children?: boolean
  has_products?: boolean
  brand_id?: number | string
}

export interface CreateCategoryRequest {
  parent_id?: number | string | null
  name: string
  description?: string | null
  image?: File | null
  is_active?: boolean
}

export interface UpdateCategoryRequest {
  parent_id?: number | string | null
  name: string
  description?: string | null
  image?: File | null
  is_active?: boolean
  remove_image?: boolean
}

export interface CreateCategoryResponse {
  message: string
  category: AdminCategory
}

export interface UpdateCategoryResponse {
  message: string
  category: AdminCategory
}

export interface DeleteCategoryResponse {
  message: string
}

export interface BulkDeleteCategoriesRequest {
  category_ids: Array<number | string>
}

export interface BulkDeleteCategoriesResponse {
  message: string
  deleted_count: number
}

export interface UpdateCategoryParentRequest {
  parent_id: number | string | null
}

export interface UpdateCategoryParentResponse {
  message: string
  category: AdminCategory
}
