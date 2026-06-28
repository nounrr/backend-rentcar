// URL de base de l'API Laravel, appelee DIRECTEMENT par le navigateur (SPA statique).
// En prod : "/location/backend/api" (chemin relatif, meme domaine).
// En local : "http://127.0.0.1:8000/api".
const DEFAULT_BACKEND_API_BASE_URL = "http://127.0.0.1:8000/api"

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "")

export const apiConfig = {
  backendBaseUrl: normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BACKEND_API_BASE_URL
  ),
  routes: {
    // Routes d'authentification : prefixe Laravel reel /users/*.
    auth: {
      signIn: "/users/login",
      forgotPassword: "/users/forgot-password",
      currentUser: "/users/me",
      signOut: "/users/logout",
      updateProfile: "/users/profile",
      updatePassword: "/users/password",
    },
    admin: {
      users: "/admin/users",
      roles: "/admin/roles",
      permissions: "/admin/permissions",
      settings: "/admin/settings",
      brands: "/admin/brands",
      categories: "/admin/categories",
      customers: "/admin/customers",
      vehicleCategories: "/admin/vehicle-categories",
      vehicles: "/admin/vehicles",
      reservations: "/admin/reservations",
      payments: "/admin/payments",
      oilChanges: "/admin/oil-changes",
      maintenanceRecords: "/admin/maintenance-records",
      maintenanceOverview: "/admin/maintenance/overview",
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
