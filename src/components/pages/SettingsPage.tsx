"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Save, Settings } from "lucide-react"
import { toast } from "sonner"

import { ListPageShell } from "@/components/admin/list-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useGetAlertSettingsQuery,
  useUpdateAlertSettingsMutation,
} from "@/store/api/settings"

function getErrorMessage(error: unknown, fallback = "Impossible d'enregistrer les parametres.") {
  if (error && typeof error === "object") {
    const candidate = error as { data?: { message?: unknown }; error?: string }
    if (typeof candidate.data?.message === "string") return candidate.data.message
    if (typeof candidate.error === "string") return candidate.error
  }
  return fallback
}

export function SettingsPage() {
  const t = useTranslations("Settings")
  const tc = useTranslations("Common")
  const { data: settings, isLoading } = useGetAlertSettingsQuery()
  const [updateSettings, { isLoading: isSaving }] = useUpdateAlertSettingsMutation()
  const [insuranceDays, setInsuranceDays] = useState("30")
  const [technicalDays, setTechnicalDays] = useState("30")
  const [vignetteDays, setVignetteDays] = useState("30")
  const [oilKm, setOilKm] = useState("150")

  useEffect(() => {
    if (!settings) return
    setInsuranceDays(String(settings.insurance_alert_days ?? settings.document_expiration_alert_days))
    setTechnicalDays(String(settings.technical_inspection_alert_days ?? settings.document_expiration_alert_days))
    setVignetteDays(String(settings.tax_vignette_alert_days ?? settings.document_expiration_alert_days))
    setOilKm(String(settings.oil_change_alert_km))
  }, [settings])

  const submit = async () => {
    const insuranceValue = Number(insuranceDays)
    const technicalValue = Number(technicalDays)
    const vignetteValue = Number(vignetteDays)
    const oilValue = Number(oilKm)

    if (
      !Number.isFinite(insuranceValue) || insuranceValue < 1 ||
      !Number.isFinite(technicalValue) || technicalValue < 1 ||
      !Number.isFinite(vignetteValue) || vignetteValue < 1
    ) {
      toast.error(t("errorThresholdPositive"))
      return
    }

    if (!Number.isFinite(oilValue) || oilValue < 1) {
      toast.error(t("errorOilPositive"))
      return
    }

    try {
      await updateSettings({
        document_expiration_alert_days: Math.min(insuranceValue, technicalValue, vignetteValue),
        insurance_alert_days: insuranceValue,
        technical_inspection_alert_days: technicalValue,
        tax_vignette_alert_days: vignetteValue,
        oil_change_alert_km: oilValue,
      }).unwrap()
      toast.success(t("saved"))
    } catch (error) {
      toast.error(getErrorMessage(error, t("saveError")))
    }
  }

  return (
    <ListPageShell
      badge={t("badge")}
      title={t("title")}
      description={t("description")}
      action={
        <Button onClick={submit} disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {tc("save")}
        </Button>
      }
    >
      <Card className="max-w-3xl border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4 text-primary" />
            {t("defaultAlerts")}
          </CardTitle>
          <CardDescription>
            {t("defaultAlertsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="insurance-alert-days">
              {t("insuranceBeforeExpiry")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="insurance-alert-days"
                type="number"
                min={1}
                max={365}
                value={insuranceDays}
                onChange={(event) => setInsuranceDays(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">{t("days")}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="technical-alert-days">
              {t("technicalBeforeExpiry")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="technical-alert-days"
                type="number"
                min={1}
                max={365}
                value={technicalDays}
                onChange={(event) => setTechnicalDays(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">{t("days")}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="vignette-alert-days">
              {t("vignetteBeforeExpiry")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="vignette-alert-days"
                type="number"
                min={1}
                max={365}
                value={vignetteDays}
                onChange={(event) => setVignetteDays(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">{t("days")}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="oil-alert-km">
              {t("oilAlertWhenLeft")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="oil-alert-km"
                type="number"
                min={1}
                max={10000}
                value={oilKm}
                onChange={(event) => setOilKm(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">{t("km")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </ListPageShell>
  )
}
