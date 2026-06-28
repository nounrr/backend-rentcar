export interface AlertSettings {
  document_expiration_alert_days: number
  insurance_alert_days: number
  technical_inspection_alert_days: number
  tax_vignette_alert_days: number
  oil_change_alert_km: number
}

export type UpdateAlertSettingsRequest = AlertSettings
export type UpdateAlertSettingsResponse = {
  message: string
  settings: AlertSettings
}
