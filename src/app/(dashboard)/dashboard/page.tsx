import { MetricsOverview } from "./components/metrics-overview"
import { SalesChart } from "./components/sales-chart"
import { RecentTransactions } from "./components/recent-transactions"
import { TopProducts } from "./components/top-products"
import { CustomerInsights } from "./components/customer-insights"
import { QuickActions } from "./components/quick-actions"
import { RevenueBreakdown } from "./components/revenue-breakdown"
import { PageGuard } from "@/components/auth/permission-gate"
import { PERM_DASHBOARD_VIEW } from "@/lib/permissions"

export default function Dashboard() {
  return (
    <PageGuard permission={PERM_DASHBOARD_VIEW} page="Tableau de bord">
      <div className="flex-1 space-y-6 px-6 pt-2 pb-6">
        <div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <div className="bg-card/80 text-muted-foreground border-border/70 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
              <span className="size-2 rounded-full bg-primary" />
              Vue generale
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord commercial</h1>
            <p className="text-muted-foreground">
              Suivez les ventes, les commandes et les indicateurs cles de Tanger Stylo en temps reel
            </p>
          </div>
          <QuickActions />
        </div>

        <div className="@container/main space-y-6">
          <MetricsOverview />

          <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
            <SalesChart />
            <RevenueBreakdown />
          </div>

          <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
            <RecentTransactions />
            <TopProducts />
          </div>

          <CustomerInsights />
        </div>
      </div>
    </PageGuard>
  )
}

