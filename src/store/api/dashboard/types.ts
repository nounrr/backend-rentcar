export type TrendDirection = "up" | "down"

export interface DashboardMetric {
  title: string
  value: string
  description: string
  change: string
  trend: TrendDirection
  footer: string
  subfooter: string
}

export interface DashboardOverviewResponse {
  headline?: string
  subheadline?: string
  generatedAt?: string
  metrics: DashboardMetric[]
}

export interface SalesPerformancePoint {
  month: string
  sales: number
  target: number
}

export interface RevenueBreakdownItem {
  category: string
  value: number
  amount: number
}

export interface DashboardCustomer {
  name: string
  email: string
  avatar?: string | null
}

export interface RecentTransaction {
  id: string
  customer: DashboardCustomer
  amount: string
  status: string
  date: string
}

export interface TopProduct {
  id: number | string
  name: string
  sales: number
  revenue: string
  growth: string
  rating: number
  stock: number
  category: string
}

export interface CustomerGrowthPoint {
  month: string
  new: number
  returning: number
  churn: number
}

export interface DemographicRow {
  ageGroup: string
  customers: number
  percentage: string
  growth: string
}

export interface RegionRow {
  region: string
  customers: number
  revenue: string
  growth: string
}

export interface CustomerInsightsResponse {
  growth: CustomerGrowthPoint[]
  demographics: DemographicRow[]
  regions: RegionRow[]
}

export interface SalesPerformanceQueryParams {
  range?: "3m" | "6m" | "12m"
}