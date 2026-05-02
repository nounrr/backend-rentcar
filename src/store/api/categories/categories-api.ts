import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"
import type { CategoryId } from "@/store/api/categories/types"
import type {
  AdminCategory,
  BulkDeleteCategoriesRequest,
  BulkDeleteCategoriesResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  DeleteCategoryResponse,
  ListCategoriesQueryParams,
  UpdateCategoryParentRequest,
  UpdateCategoryParentResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from "./types"

const CATEGORIES_LIST_TAG = { type: "Categories" as const, id: "LIST" }
const CATEGORIES_TREE_TAG = { type: "Categories" as const, id: "TREE" }

function buildCategoryFormData(payload: CreateCategoryRequest | UpdateCategoryRequest) {
  const formData = new FormData()

  formData.set("name", payload.name)

  if (payload.parent_id != null && payload.parent_id !== "") {
    formData.set("parent_id", String(payload.parent_id))
  }

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

function buildCategoriesQuery(params?: ListCategoriesQueryParams) {
  if (!params) {
    return apiConfig.routes.admin.categories
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
    ? `${apiConfig.routes.admin.categories}?${queryString}`
    : apiConfig.routes.admin.categories
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<AdminCategory[], ListCategoriesQueryParams | void>({
      query: (params) => buildCategoriesQuery(params ?? undefined),
      providesTags: (result) =>
        result
          ? [
            ...result.map((category) => ({ type: "Categories" as const, id: category.id })),
            CATEGORIES_LIST_TAG,
            CATEGORIES_TREE_TAG,
          ]
          : [CATEGORIES_LIST_TAG, CATEGORIES_TREE_TAG],
    }),
    getCategoriesTree: builder.query<AdminCategory[], void>({
      query: () => `${apiConfig.routes.admin.categories}/tree`,
      providesTags: [CATEGORIES_TREE_TAG],
    }),
    getCategory: builder.query<AdminCategory, CategoryId>({
      query: (categoryId) => `${apiConfig.routes.admin.categories}/${categoryId}`,
      providesTags: (_result, _error, categoryId) => [
        { type: "Categories" as const, id: categoryId },
      ],
    }),
    createCategory: builder.mutation<CreateCategoryResponse, CreateCategoryRequest>({
      query: (payload) => ({
        url: apiConfig.routes.admin.categories,
        method: "POST",
        body: buildCategoryFormData(payload),
      }),
      invalidatesTags: [CATEGORIES_LIST_TAG, CATEGORIES_TREE_TAG],
    }),
    updateCategory: builder.mutation<
      UpdateCategoryResponse,
      { categoryId: CategoryId } & UpdateCategoryRequest
    >({
      query: ({ categoryId, ...payload }) => ({
        url: `${apiConfig.routes.admin.categories}/${categoryId}`,
        method: "PUT",
        body: buildCategoryFormData(payload),
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "Categories" as const, id: categoryId },
        CATEGORIES_LIST_TAG,
        CATEGORIES_TREE_TAG,
      ],
    }),
    deleteCategory: builder.mutation<DeleteCategoryResponse, CategoryId>({
      query: (categoryId) => ({
        url: `${apiConfig.routes.admin.categories}/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: [CATEGORIES_LIST_TAG, CATEGORIES_TREE_TAG],
    }),
    bulkDeleteCategories: builder.mutation<BulkDeleteCategoriesResponse, BulkDeleteCategoriesRequest>({
      query: (payload) => ({
        url: `${apiConfig.routes.admin.categories}/bulk-delete`,
        method: "DELETE",
        body: payload,
      }),
      invalidatesTags: [CATEGORIES_LIST_TAG, CATEGORIES_TREE_TAG],
    }),
    updateCategoryParent: builder.mutation<
      UpdateCategoryParentResponse,
      { categoryId: CategoryId } & UpdateCategoryParentRequest
    >({
      query: ({ categoryId, ...payload }) => ({
        url: `${apiConfig.routes.admin.categories}/${categoryId}/parent`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: [CATEGORIES_LIST_TAG, CATEGORIES_TREE_TAG],
    }),
  }),
})

export const {
  useBulkDeleteCategoriesMutation,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useGetCategoriesTreeQuery,
  useGetCategoryQuery,
  useLazyGetCategoriesQuery,
  useLazyGetCategoriesTreeQuery,
  useLazyGetCategoryQuery,
  useUpdateCategoryMutation,
  useUpdateCategoryParentMutation,
} = categoriesApi
