"use client"

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3
} from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const metrics = [
  {
    title: "Chiffre d'affaires",
    value: "54 230 €",
    description: "CA du mois",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
    footer: "En hausse ce mois-ci",
    subfooter: "Evolution du CA sur les 6 derniers mois"
  },
  {
    title: "Clients actifs",
    value: "2 350",
    description: "Clients ayant commande",
    change: "+5.2%",
    trend: "up",
    icon: Users,
    footer: "Fidelisation solide",
    subfooter: "Engagement superieur aux objectifs"
  },
  {
    title: "Commandes",
    value: "1 247",
    description: "Commandes du mois",
    change: "-2.1%",
    trend: "down",
    icon: ShoppingCart,
    footer: "Recul de 2 % sur la periode",
    subfooter: "Le volume de commandes demande une attention"
  },
  {
    title: "Taux de conversion",
    value: "3.24%",
    description: "Moyenne boutique",
    change: "+8.3%",
    trend: "up",
    icon: BarChart3,
    footer: "Progression reguliere",
    subfooter: "Les projections de conversion sont atteintes"
  },
]

export function MetricsOverview() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={metric.title} className=" cursor-pointer">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metric.footer} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {metric.subfooter}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
