const DEFAULT_BACKEND_API_BASE_URL = "http://127.0.0.1:8000/api"

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "")

export const apiConfig = {
  backendBaseUrl: normalizeBaseUrl(
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BACKEND_API_BASE_URL
  ),
  internalBaseUrl: "/api",
  routes: {
    auth: {
      signIn: "/auth/login",
      forgotPassword: "/auth/forgot-password",
      currentUser: "/auth/me",
      signOut: "/auth/logout",
    },
    admin: {
      users: "/admin/users",
      roles: "/admin/roles",
      permissions: "/admin/permissions",
      brands: "/admin/brands",
      categories: "/admin/categories",
    },
    dashboard: {
      overview: "/dashboard/overview",
      salesPerformance: "/dashboard/sales-performance",
      revenueBreakdown: "/dashboard/revenue-breakdown",
      recentTransactions: "/dashboard/recent-transactions",
      topProducts: "/dashboard/top-products",
      customerInsights: "/dashboard/customer-insights",
    },
  },
} as const
