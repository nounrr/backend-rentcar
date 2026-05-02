import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"
import type { BrandId } from "@/store/api/brands/types"
import type {
  AdminBrand,
  BulkDeleteBrandsRequest,
  BulkDeleteBrandsResponse,
  CreateBrandRequest,
  CreateBrandResponse,
  DeleteBrandResponse,
  ListBrandsQueryParams,
  UpdateBrandRequest,
  UpdateBrandResponse,
} from "./types"

const BRANDS_LIST_TAG = { type: "Brands" as const, id: "LIST" }

function buildBrandFormData(payload: CreateBrandRequest | UpdateBrandRequest) {
  const formData = new FormData()

  formData.set("name", payload.name)

  if (payload.description !== undefined && payload.description !== null) {
    formData.set("description", payload.description)
  }

  if (payload.is_active !== undefined) {
    formData.set("is_active", payload.is_active ? "1" : "0")
  }

  if ("remove_image" in payload && payload.remove_image !== undefined) {
    formData.set("remove_image", payload.remove_image ? "1" : "0")
  }

  if (payload.image) {
    formData.set("image", payload.image)
  }

  return formData
}

function buildBrandsQuery(params?: ListBrandsQueryParams) {
  if (!params) {
    return apiConfig.routes.admin.brands
  }

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()

  return queryString
    ? `${apiConfig.routes.admin.brands}?${queryString}`
    : apiConfig.routes.admin.brands
}

export const brandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query<AdminBrand[], ListBrandsQueryParams | void>({
      query: (params) => buildBrandsQuery(params ?? undefined),
      providesTags: (result) =>
        result
          ? [
            ...result.map((brand) => ({ type: "Brands" as const, id: brand.id })),
            BRANDS_LIST_TAG,
          ]
          : [BRANDS_LIST_TAG],
    }),
    getBrand: builder.query<AdminBrand, BrandId>({
      query: (brandId) => `${apiConfig.routes.admin.brands}/${brandId}`,
      providesTags: (_result, _error, brandId) => [
        { type: "Brands" as const, id: brandId },
      ],
    }),
    createBrand: builder.mutation<CreateBrandResponse, CreateBrandRequest>({
      query: (payload) => ({
        url: apiConfig.routes.admin.brands,
        method: "POST",
        body: buildBrandFormData(payload),
      }),
      invalidatesTags: [BRANDS_LIST_TAG],
    }),
    updateBrand: builder.mutation<UpdateBrandResponse, { brandId: BrandId } & UpdateBrandRequest>({
      query: ({ brandId, ...payload }) => ({
        url: `${apiConfig.routes.admin.brands}/${brandId}`,
        method: "PUT",
        body: buildBrandFormData(payload),
      }),
      invalidatesTags: (_result, _error, { brandId }) => [
        { type: "Brands" as const, id: brandId },
        BRANDS_LIST_TAG,
      ],
    }),
    deleteBrand: builder.mutation<DeleteBrandResponse, BrandId>({
      query: (brandId) => ({
        url: `${apiConfig.routes.admin.brands}/${brandId}`,
        method: "DELETE",
      }),
      invalidatesTags: [BRANDS_LIST_TAG],
    }),
    bulkDeleteBrands: builder.mutation<BulkDeleteBrandsResponse, BulkDeleteBrandsRequest>({
      query: (payload) => ({
        url: `${apiConfig.routes.admin.brands}/bulk-delete`,
        method: "DELETE",
        body: payload,
      }),
      invalidatesTags: [BRANDS_LIST_TAG],
    }),
  }),
})

export const {
  useBulkDeleteBrandsMutation,
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useGetBrandQuery,
  useGetBrandsQuery,
  useLazyGetBrandQuery,
  useLazyGetBrandsQuery,
  useUpdateBrandMutation,
} = brandsApi
