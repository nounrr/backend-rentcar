import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  AdminCustomer,
  BulkDeleteCustomersRequest,
  BulkDeleteCustomersResponse,
  BulkUpdateCustomerStatusRequest,
  BulkUpdateCustomerStatusResponse,
  CreateCustomerResponse,
  CustomerFormRequest,
  CustomerId,
  DeleteCustomerResponse,
  ListCustomersQueryParams,
  UpdateCustomerResponse,
} from "./types"

const CUSTOMERS_LIST_TAG = { type: "Customers" as const, id: "LIST" }

function buildCustomersQuery(params?: ListCustomersQueryParams) {
  if (!params) return apiConfig.routes.admin.customers

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()

  return queryString
    ? `${apiConfig.routes.admin.customers}?${queryString}`
    : apiConfig.routes.admin.customers
}

function buildCustomerFormData(payload: CustomerFormRequest) {
  const formData = new FormData()

  formData.set("full_name", payload.full_name)
  formData.set("phone", payload.phone)
  formData.set("email", payload.email)
  formData.set("address", payload.address)
  formData.set("city", payload.city)
  formData.set("nationality", payload.nationality)
  formData.set("driving_license_number", payload.driving_license_number)
  formData.set("driving_license_issued_at", payload.driving_license_issued_at)
  formData.set("driving_license_expires_at", payload.driving_license_expires_at)

  if (payload.cin) formData.set("cin", payload.cin)
  if (payload.passport) formData.set("passport", payload.passport)
  if (payload.password) formData.set("password", payload.password)
  if (payload.is_active !== undefined) formData.set("is_active", payload.is_active ? "1" : "0")
  if (payload.remove_driving_license_scan !== undefined) {
    formData.set("remove_driving_license_scan", payload.remove_driving_license_scan ? "1" : "0")
  }
  if (payload.remove_driving_license_back_scan !== undefined) {
    formData.set("remove_driving_license_back_scan", payload.remove_driving_license_back_scan ? "1" : "0")
  }
  if (payload.remove_identity_document_scan !== undefined) {
    formData.set("remove_identity_document_scan", payload.remove_identity_document_scan ? "1" : "0")
  }
  if (payload.remove_identity_document_back_scan !== undefined) {
    formData.set("remove_identity_document_back_scan", payload.remove_identity_document_back_scan ? "1" : "0")
  }
  if (payload.driving_license_scan) {
    formData.set("driving_license_scan", payload.driving_license_scan)
  }
  if (payload.driving_license_back_scan) {
    formData.set("driving_license_back_scan", payload.driving_license_back_scan)
  }
  if (payload.identity_document_scan) {
    formData.set("identity_document_scan", payload.identity_document_scan)
  }
  if (payload.identity_document_back_scan) {
    formData.set("identity_document_back_scan", payload.identity_document_back_scan)
  }

  return formData
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<AdminCustomer[], ListCustomersQueryParams | void>({
      query: (params) => buildCustomersQuery(params ?? undefined),
      providesTags: (result) =>
        result
          ? [
              ...result.map((customer) => ({ type: "Customers" as const, id: customer.id })),
              CUSTOMERS_LIST_TAG,
            ]
          : [CUSTOMERS_LIST_TAG],
    }),
    getCustomer: builder.query<AdminCustomer, CustomerId>({
      query: (customerId) => `${apiConfig.routes.admin.customers}/${customerId}`,
      providesTags: (_result, _error, customerId) => [
        { type: "Customers" as const, id: customerId },
      ],
    }),
    createCustomer: builder.mutation<CreateCustomerResponse, CustomerFormRequest>({
      query: (payload) => ({
        url: apiConfig.routes.admin.customers,
        method: "POST",
        body: buildCustomerFormData(payload),
      }),
      invalidatesTags: [CUSTOMERS_LIST_TAG],
    }),
    updateCustomer: builder.mutation<
      UpdateCustomerResponse,
      { customerId: CustomerId } & CustomerFormRequest
    >({
      query: ({ customerId, ...payload }) => ({
        url: `${apiConfig.routes.admin.customers}/${customerId}`,
        method: "PUT",
        body: buildCustomerFormData(payload),
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: "Customers" as const, id: customerId },
        CUSTOMERS_LIST_TAG,
      ],
    }),
    deleteCustomer: builder.mutation<DeleteCustomerResponse, CustomerId>({
      query: (customerId) => ({
        url: `${apiConfig.routes.admin.customers}/${customerId}`,
        method: "DELETE",
      }),
      invalidatesTags: [CUSTOMERS_LIST_TAG],
    }),
    bulkDeleteCustomers: builder.mutation<
      BulkDeleteCustomersResponse,
      BulkDeleteCustomersRequest
    >({
      query: (payload) => ({
        url: `${apiConfig.routes.admin.customers}/bulk-delete`,
        method: "DELETE",
        body: payload,
      }),
      invalidatesTags: [CUSTOMERS_LIST_TAG],
    }),
    bulkUpdateCustomerStatus: builder.mutation<
      BulkUpdateCustomerStatusResponse,
      BulkUpdateCustomerStatusRequest
    >({
      query: (payload) => ({
        url: `${apiConfig.routes.admin.customers}/bulk-status`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: [CUSTOMERS_LIST_TAG],
    }),
  }),
})

export const {
  useBulkDeleteCustomersMutation,
  useBulkUpdateCustomerStatusMutation,
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerQuery,
  useGetCustomersQuery,
  useLazyGetCustomerQuery,
  useLazyGetCustomersQuery,
  useUpdateCustomerMutation,
} = customersApi
