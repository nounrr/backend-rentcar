import { apiConfig } from "@/config/api"
import { baseApi } from "@/store/api/base-api"

import type {
  CustomerInsightsResponse,
  DashboardOverviewResponse,
  RecentTransaction,
  RevenueBreakdownItem,
  SalesPerformancePoint,
  SalesPerformanceQueryParams,
  TopProduct,
} from "./types"

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<DashboardOverviewResponse, void>({
      query: () => apiConfig.routes.dashboard.overview,
      providesTags: ["Dashboard"],
    }),
    getSalesPerformance: builder.query<
      SalesPerformancePoint[],
      SalesPerformanceQueryParams | void
    >({
      query: (params) => ({
        url: apiConfig.routes.dashboard.salesPerformance,
        params: params?.range ? { range: params.range } : undefined,
      }),
      providesTags: ["Dashboard"],
    }),
    getRevenueBreakdown: builder.query<RevenueBreakdownItem[], void>({
      query: () => apiConfig.routes.dashboard.revenueBreakdown,
      providesTags: ["Dashboard"],
    }),
    getRecentTransactions: builder.query<RecentTransaction[], void>({
      query: () => apiConfig.routes.dashboard.recentTransactions,
      providesTags: ["Dashboard"],
    }),
    getTopProducts: builder.query<TopProduct[], void>({
      query: () => apiConfig.routes.dashboard.topProducts,
      providesTags: ["Dashboard"],
    }),
    getCustomerInsights: builder.query<CustomerInsightsResponse, void>({
      query: () => apiConfig.routes.dashboard.customerInsights,
      providesTags: ["Dashboard"],
    }),
  }),
})

export const {
  useGetCustomerInsightsQuery,
  useGetDashboardOverviewQuery,
  useGetRecentTransactionsQuery,
  useGetRevenueBreakdownQuery,
  useGetSalesPerformanceQuery,
  useGetTopProductsQuery,
} = dashboardApi

export const usePrefetchDashboardOverview = () =>
  dashboardApi.usePrefetch("getDashboardOverview")