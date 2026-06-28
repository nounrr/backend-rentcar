"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Car,
  CircleCheck,
  CircleOff,
  FileText,
  Fuel,
  Gauge,
  History,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/admin/data-table"
import { ListPageShell } from "@/components/admin/list-page-shell"
import { PermissionGate } from "@/components/auth/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  PERM_VEHICLES_CREATE,
  PERM_VEHICLES_DELETE,
  PERM_VEHICLES_EDIT,
} from "@/lib/permissions"
import type {
  AdminVehicle,
  VehicleCategory,
  VehicleFormRequest,
  VehicleMileageHistory,
} from "@/store/api/vehicles"
import {
  useBulkDeleteVehiclesMutation,
  useBulkUpdateVehicleStatusMutation,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useGetVehicleCategoriesQuery,
  useGetVehicleMileageHistoryQuery,
  useGetVehiclesQuery,
  useUpdateVehicleMutation,
} from "@/store/api/vehicles"

type VehicleDialogMode = "create" | "edit"

const EMPTY_VEHICLES: AdminVehicle[] = []
const EMPTY_CATEGORIES: VehicleCategory[] = []

const vehicleStatuses = [
  { value: "available", label: "Disponible" },
  { value: "rented", label: "Loué" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactif" },
] as const

const fuelTypes = ["Essence", "Diesel", "Hybride", "Electrique", "GPL"] as const
const transmissionTypes = ["Manuelle", "Automatique"] as const

type VehicleFormState = {
  registration_number: string
  brand: string
  model: string
  year: string
  vehicle_category_id: string
  color: string
  seats: string
  fuel_type: string
  transmission: string
  current_mileage: string
  oil_change_interval_km: string
  last_oil_change_km: string
  last_oil_change_at: string
  daily_rental_price: string
  deposit_amount: string
  status: string
  is_subcontracted: boolean
  subcontract_start_date: string
  subcontract_end_date: string
  subcontract_daily_cost: string
  vehicle_photos: File[]
  chassis_number: string
  insurance_expires_at: string
  technical_inspection_expires_at: string
  tax_vignette_expires_at: string
  registration_card_document: File | null
  insurance_document: File | null
  remove_photos: boolean
  remove_registration_card_document: boolean
  remove_insurance_document: boolean
}

const emptyVehicleForm: VehicleFormState = {
  registration_number: "",
  brand: "",
  model: "",
  year: String(new Date().getFullYear()),
  vehicle_category_id: "",
  color: "",
  seats: "5",
  fuel_type: "Essence",
  transmission: "Manuelle",
  current_mileage: "0",
  oil_change_interval_km: "10000",
  last_oil_change_km: "",
  last_oil_change_at: "",
  daily_rental_price: "",
  deposit_amount: "",
  status: "available",
  is_subcontracted: false,
  subcontract_start_date: "",
  subcontract_end_date: "",
  subcontract_daily_cost: "",
  vehicle_photos: [],
  chassis_number: "",
  insurance_expires_at: "",
  technical_inspection_expires_at: "",
  tax_vignette_expires_at: "",
  registration_card_document: null,
  insurance_document: null,
  remove_photos: false,
  remove_registration_card_document: false,
  remove_insurance_document: false,
}

function getErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error && typeof error === "object") {
    const candidate = error as { data?: { message?: unknown }; error?: string }
    if (typeof candidate.data?.message === "string") return candidate.data.message
    if (typeof candidate.error === "string") return candidate.error
  }
  return fallback
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDate(value?: string) {
  if (!value) return "Non renseignee"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function formatKm(value: number | null | undefined) {
  if (value === null || value === undefined) return "-"
  return `${value.toLocaleString("fr-FR")} km`
}

function mileageSourceLabel(source: string) {
  const labels: Record<string, string> = {
    vehicle_create: "Creation vehicule",
    manual_update: "Modification manuelle",
    reservation_return: "Retour reservation",
    oil_change: "Vidange",
  }

  return labels[source] ?? source
}

function documentAlertText(days: number | null) {
  if (days === null) return "date inconnue"
  if (days < 0) return `expire depuis ${Math.abs(days)} j`
  if (days === 0) return "expire aujourd'hui"
  return `${days} j restants`
}

function statusLabel(status: string) {
  return vehicleStatuses.find((item) => item.value === status)?.label ?? status
}

function vehicleToForm(vehicle: AdminVehicle | null): VehicleFormState {
  if (!vehicle) return emptyVehicleForm

  return {
    registration_number: vehicle.registration_number,
    brand: vehicle.brand,
    model: vehicle.model,
    year: String(vehicle.year),
    vehicle_category_id: String(vehicle.vehicle_category_id),
    color: vehicle.color,
    seats: String(vehicle.seats),
    fuel_type: vehicle.fuel_type,
    transmission: vehicle.transmission,
    current_mileage: String(vehicle.current_mileage),
    oil_change_interval_km: String(vehicle.oil_change_interval_km ?? 10000),
    last_oil_change_km: vehicle.last_oil_change_km !== null && vehicle.last_oil_change_km !== undefined ? String(vehicle.last_oil_change_km) : "",
    last_oil_change_at: vehicle.last_oil_change_at?.slice(0, 10) ?? "",
    daily_rental_price: String(vehicle.daily_rental_price),
    deposit_amount: String(vehicle.deposit_amount),
    status: vehicle.status,
    is_subcontracted: Boolean(vehicle.is_subcontracted),
    subcontract_start_date: vehicle.subcontract_start_date?.slice(0, 10) ?? "",
    subcontract_end_date: vehicle.subcontract_end_date?.slice(0, 10) ?? "",
    subcontract_daily_cost: vehicle.subcontract_daily_cost !== null && vehicle.subcontract_daily_cost !== undefined ? String(vehicle.subcontract_daily_cost) : "",
    vehicle_photos: [],
    chassis_number: vehicle.chassis_number,
    insurance_expires_at: vehicle.insurance_expires_at?.slice(0, 10) ?? "",
    technical_inspection_expires_at: vehicle.technical_inspection_expires_at?.slice(0, 10) ?? "",
    tax_vignette_expires_at: vehicle.tax_vignette_expires_at?.slice(0, 10) ?? "",
    registration_card_document: null,
    insurance_document: null,
    remove_photos: false,
    remove_registration_card_document: false,
    remove_insurance_document: false,
  }
}

function buildVehiclePayload(form: VehicleFormState): VehicleFormRequest {
  return {
    registration_number: form.registration_number.trim(),
    brand: form.brand.trim(),
    model: form.model.trim(),
    year: Number(form.year),
    vehicle_category_id: form.vehicle_category_id,
    color: form.color.trim(),
    seats: Number(form.seats),
    fuel_type: form.fuel_type,
    transmission: form.transmission,
    current_mileage: Number(form.current_mileage),
    oil_change_interval_km: form.oil_change_interval_km ? Number(form.oil_change_interval_km) : undefined,
    last_oil_change_km: form.last_oil_change_km ? Number(form.last_oil_change_km) : null,
    last_oil_change_at: form.last_oil_change_at || null,
    daily_rental_price: Number(form.daily_rental_price),
    deposit_amount: Number(form.deposit_amount),
    status: form.status,
    is_subcontracted: form.is_subcontracted,
    subcontract_start_date: form.is_subcontracted ? form.subcontract_start_date : null,
    subcontract_end_date: form.is_subcontracted ? form.subcontract_end_date : null,
    subcontract_daily_cost: form.is_subcontracted && form.subcontract_daily_cost ? Number(form.subcontract_daily_cost) : null,
    vehicle_photos: form.vehicle_photos,
    chassis_number: form.chassis_number.trim(),
    insurance_expires_at: form.insurance_expires_at,
    technical_inspection_expires_at: form.technical_inspection_expires_at,
    tax_vignette_expires_at: form.tax_vignette_expires_at,
    registration_card_document: form.registration_card_document,
    insurance_document: form.insurance_document,
    remove_photos: form.remove_photos,
    remove_registration_card_document: form.remove_registration_card_document,
    remove_insurance_document: form.remove_insurance_document,
  }
}

function VehicleDialog({
  open,
  mode,
  vehicle,
  categories,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  mode: VehicleDialogMode
  vehicle: AdminVehicle | null
  categories: VehicleCategory[]
  isSaving: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (payload: VehicleFormRequest) => Promise<void>
}) {
  const [form, setForm] = useState<VehicleFormState>(emptyVehicleForm)

  useEffect(() => {
    if (!open) return
    const next = vehicleToForm(vehicle)
    if (!next.vehicle_category_id && categories[0]) {
      next.vehicle_category_id = String(categories[0].id)
    }
    setForm(next)
  }, [categories, open, vehicle])

  const isInvalid =
    form.registration_number.trim().length === 0 ||
    form.brand.trim().length === 0 ||
    form.model.trim().length === 0 ||
    form.vehicle_category_id.length === 0 ||
    form.color.trim().length === 0 ||
    form.chassis_number.trim().length === 0 ||
    form.daily_rental_price.length === 0 ||
    form.deposit_amount.length === 0 ||
    (form.is_subcontracted && (
      form.subcontract_start_date.length === 0 ||
      form.subcontract_end_date.length === 0 ||
      form.subcontract_daily_cost.length === 0
    )) ||
    form.insurance_expires_at.length === 0 ||
    form.technical_inspection_expires_at.length === 0 ||
    form.tax_vignette_expires_at.length === 0

  const handleSubmit = async () => onSubmit(buildVehiclePayload(form))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:h-[min(90dvh,780px)] sm:max-w-[860px]">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <DialogTitle>{mode === "create" ? "Ajouter un vehicule" : "Modifier le vehicule"}</DialogTitle>
          <DialogDescription className="mt-1">
            Informations techniques, tarifaires, documents et photos du vehicule.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 px-6 py-5 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-registration">Matricule</label>
              <Input id="vehicle-registration" value={form.registration_number} onChange={(e) => setForm((c) => ({ ...c, registration_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-brand">Marque</label>
              <Input id="vehicle-brand" value={form.brand} onChange={(e) => setForm((c) => ({ ...c, brand: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-model">Modele</label>
              <Input id="vehicle-model" value={form.model} onChange={(e) => setForm((c) => ({ ...c, model: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-year">Annee</label>
              <Input id="vehicle-year" type="number" value={form.year} onChange={(e) => setForm((c) => ({ ...c, year: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-category">Categorie</label>
              <Select value={form.vehicle_category_id} onValueChange={(value) => setForm((c) => ({ ...c, vehicle_category_id: value }))}>
                <SelectTrigger id="vehicle-category" className="w-full"><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-color">Couleur</label>
              <Input id="vehicle-color" value={form.color} onChange={(e) => setForm((c) => ({ ...c, color: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-seats">Nombre de places</label>
              <Input id="vehicle-seats" type="number" min={1} value={form.seats} onChange={(e) => setForm((c) => ({ ...c, seats: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-fuel">Type de carburant</label>
              <Select value={form.fuel_type} onValueChange={(value) => setForm((c) => ({ ...c, fuel_type: value }))}>
                <SelectTrigger id="vehicle-fuel" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuel) => <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-transmission">Boite de vitesse</label>
              <Select value={form.transmission} onValueChange={(value) => setForm((c) => ({ ...c, transmission: value }))}>
                <SelectTrigger id="vehicle-transmission" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {transmissionTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-mileage">Kilometrage actuel</label>
              <Input id="vehicle-mileage" type="number" min={0} value={form.current_mileage} onChange={(e) => setForm((c) => ({ ...c, current_mileage: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-oil-interval">Intervalle vidange (km)</label>
              <Input id="vehicle-oil-interval" type="number" min={1000} step={500} value={form.oil_change_interval_km} onChange={(e) => setForm((c) => ({ ...c, oil_change_interval_km: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-last-oil-km">Derniere vidange (km)</label>
              <Input id="vehicle-last-oil-km" type="number" min={0} value={form.last_oil_change_km} onChange={(e) => setForm((c) => ({ ...c, last_oil_change_km: e.target.value }))} placeholder="Optionnel" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-last-oil-at">Derniere vidange (date)</label>
              <Input id="vehicle-last-oil-at" type="date" value={form.last_oil_change_at} onChange={(e) => setForm((c) => ({ ...c, last_oil_change_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-price">Prix par jour</label>
              <Input id="vehicle-price" type="number" min={0} value={form.daily_rental_price} onChange={(e) => setForm((c) => ({ ...c, daily_rental_price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-deposit">Caution</label>
              <Input id="vehicle-deposit" type="number" min={0} value={form.deposit_amount} onChange={(e) => setForm((c) => ({ ...c, deposit_amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-status">Statut</label>
              <Select value={form.status} onValueChange={(value) => setForm((c) => ({ ...c, status: value }))}>
                <SelectTrigger id="vehicle-status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 rounded-md border border-border/70 p-3 md:col-span-3">
              <label className="flex items-start gap-2 text-sm font-medium">
                <Checkbox
                  checked={form.is_subcontracted}
                  onCheckedChange={(checked) => setForm((c) => ({ ...c, is_subcontracted: checked === true }))}
                />
                <span>
                  Vehicule reloue
                  <span className="block text-xs font-normal text-muted-foreground">
                    Cochez si ce vehicule n'appartient pas a l'agence et qu'il est loue a un fournisseur.
                  </span>
                </span>
              </label>
              {form.is_subcontracted ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="vehicle-subcontract-start">Date debut location</label>
                    <Input id="vehicle-subcontract-start" type="date" value={form.subcontract_start_date} onChange={(e) => setForm((c) => ({ ...c, subcontract_start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="vehicle-subcontract-end">Date fin location</label>
                    <Input id="vehicle-subcontract-end" type="date" value={form.subcontract_end_date} onChange={(e) => setForm((c) => ({ ...c, subcontract_end_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="vehicle-subcontract-cost">Prix loue / jour</label>
                    <Input id="vehicle-subcontract-cost" type="number" min={0} value={form.subcontract_daily_cost} onChange={(e) => setForm((c) => ({ ...c, subcontract_daily_cost: e.target.value }))} placeholder="ex: 150" />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="vehicle-chassis">Numero de chassis</label>
              <Input id="vehicle-chassis" value={form.chassis_number} onChange={(e) => setForm((c) => ({ ...c, chassis_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-insurance-exp">Expiration assurance</label>
              <Input id="vehicle-insurance-exp" type="date" value={form.insurance_expires_at} onChange={(e) => setForm((c) => ({ ...c, insurance_expires_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-technical-exp">Expiration visite technique</label>
              <Input id="vehicle-technical-exp" type="date" value={form.technical_inspection_expires_at} onChange={(e) => setForm((c) => ({ ...c, technical_inspection_expires_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-tax-exp">Expiration vignette</label>
              <Input id="vehicle-tax-exp" type="date" value={form.tax_vignette_expires_at} onChange={(e) => setForm((c) => ({ ...c, tax_vignette_expires_at: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium" htmlFor="vehicle-photos">Photos du vehicule</label>
              <Input id="vehicle-photos" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={(e) => setForm((c) => ({ ...c, vehicle_photos: Array.from(e.target.files ?? []), remove_photos: false }))} />
              {vehicle?.photo_urls?.length ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={form.remove_photos} onCheckedChange={(checked) => setForm((c) => ({ ...c, remove_photos: checked === true }))} />
                  Retirer les photos actuelles
                </label>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-card-doc">Document carte grise</label>
              <Input id="vehicle-card-doc" type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={(e) => setForm((c) => ({ ...c, registration_card_document: e.target.files?.[0] ?? null, remove_registration_card_document: false }))} />
              {vehicle?.registration_card_document_url ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={form.remove_registration_card_document} onCheckedChange={(checked) => setForm((c) => ({ ...c, remove_registration_card_document: checked === true }))} />
                  Retirer le document actuel
                </label>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-insurance-doc">Document assurance</label>
              <Input id="vehicle-insurance-doc" type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={(e) => setForm((c) => ({ ...c, insurance_document: e.target.files?.[0] ?? null, remove_insurance_document: false }))} />
              {vehicle?.insurance_document_url ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={form.remove_insurance_document} onCheckedChange={(checked) => setForm((c) => ({ ...c, remove_insurance_document: checked === true }))} />
                  Retirer le document actuel
                </label>
              ) : null}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSaving || isInvalid || categories.length === 0}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Creer" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isLoading,
  destructive,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isLoading: boolean
  destructive?: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MileageHistoryDialog({
  vehicle,
  history,
  isLoading,
  onOpenChange,
}: {
  vehicle: AdminVehicle | null
  history: VehicleMileageHistory[]
  isLoading: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(vehicle)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Historique kilometrage</DialogTitle>
          <DialogDescription>
            {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})` : "Mouvements de kilometrage du vehicule."}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex h-44 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-md border border-border/70 p-4 text-sm text-muted-foreground">
            Aucun historique de kilometrage pour ce vehicule.
          </div>
        ) : (
          <ScrollArea className="max-h-[460px] pr-3">
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="rounded-md border border-border/70 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{mileageSourceLabel(item.source)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.recorded_at)}</p>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full">
                      {formatKm(item.distance_km)} parcourus
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Ancien</p>
                      <p className="tabular-nums">{formatKm(item.old_mileage_km)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nouveau</p>
                      <p className="tabular-nums">{formatKm(item.new_mileage_km)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reference</p>
                      <p className="truncate">
                        {item.reservation_id ? `Reservation #${item.reservation_id}` : item.oil_change_id ? `Vidange #${item.oil_change_id}` : "-"}
                      </p>
                    </div>
                  </div>
                  {item.reservation?.client?.full_name || item.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[item.reservation?.client?.full_name, item.notes].filter(Boolean).join(" - ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

function getVehicleColumns({
  selectedIds,
  onToggleAll,
  onToggleOne,
  onHistory,
  onEdit,
  onDelete,
}: {
  selectedIds: string[]
  onToggleAll: (checked: boolean) => void
  onToggleOne: (id: string, checked: boolean) => void
  onHistory: (vehicle: AdminVehicle) => void
  onEdit: (vehicle: AdminVehicle) => void
  onDelete: (vehicle: AdminVehicle) => void
}): ColumnDef<AdminVehicle>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const rows = table.options.data
        const allSelected = rows.length > 0 && rows.every((vehicle) => selectedIds.includes(String(vehicle.id)))
        const someSelected = rows.some((vehicle) => selectedIds.includes(String(vehicle.id)))
        return <Checkbox checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={(checked) => onToggleAll(checked === true)} />
      },
      cell: ({ row }) => <Checkbox checked={selectedIds.includes(String(row.original.id))} onCheckedChange={(checked) => onToggleOne(String(row.original.id), checked === true)} />,
    },
    {
      accessorKey: "registration_number",
      header: "Vehicule",
      cell: ({ row }) => {
        const vehicle = row.original
        return (
          <div className="flex items-center gap-3">
            {vehicle.photo_urls?.[0] ? (
              <img src={vehicle.photo_urls[0]} alt={vehicle.registration_number} className="size-12 rounded-md border border-border/70 object-cover" />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-md border border-border/70 bg-muted">
                <Car className="size-5 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{vehicle.registration_number}</p>
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">{statusLabel(vehicle.status)}</Badge>
                {vehicle.is_subcontracted ? (
                  <Badge className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-700 hover:bg-sky-500/15 dark:text-sky-300">
                    Vehicule reloue
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model} - {vehicle.year}</p>
            </div>
          </div>
        )
      },
    },
    {
      id: "category",
      header: "Categorie",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.category?.name ?? "Non classe"}</span>,
    },
    {
      id: "specs",
      header: "Details",
      cell: ({ row }) => {
        const oil = row.original.oil_change_status
        return (
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-1.5"><Fuel className="size-3.5 text-muted-foreground" />{row.original.fuel_type} - {row.original.transmission}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground"><Gauge className="size-3.5" />{row.original.current_mileage.toLocaleString("fr-FR")} km - {row.original.seats} places</p>
            {oil && oil.status === "overdue" ? (
              <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300">
                Vidange en retard
              </Badge>
            ) : oil && oil.status === "soon" ? (
              <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
                Vidange bientot{typeof oil.km_remaining === "number" ? ` · ${oil.km_remaining.toLocaleString("fr-FR")} km` : ""}
              </Badge>
            ) : null}
          </div>
        )
      },
    },
    {
      id: "pricing",
      header: "Tarif",
      cell: ({ row }) => (
        <div className="space-y-1 text-sm">
          <p>{formatCurrency(row.original.daily_rental_price)} / jour</p>
          <p className="text-xs text-muted-foreground">Caution {formatCurrency(row.original.deposit_amount)}</p>
        </div>
      ),
    },
    {
      id: "documents",
      header: "Documents",
      cell: ({ row }) => {
        const alerts = row.original.document_alerts ?? []
        const activeAlerts = alerts.filter((item) => item.status === "soon" || item.status === "overdue")

        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Assurance: {formatDate(row.original.insurance_expires_at)}</p>
            <p>Visite: {formatDate(row.original.technical_inspection_expires_at)}</p>
            <p>Vignette: {formatDate(row.original.tax_vignette_expires_at)}</p>
            {activeAlerts.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {activeAlerts.map((item) => (
                  <Badge
                    key={item.key}
                    className={
                      item.status === "overdue"
                        ? "bg-rose-500/15 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300"
                        : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
                    }
                  >
                    {item.label} - {documentAlertText(item.days_remaining)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8" title="Historique kilometrage" onClick={() => onHistory(row.original)}><History className="size-3.5" /></Button>
          <PermissionGate permission={PERM_VEHICLES_EDIT}>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(row.original)}><Pencil className="size-3.5" /></Button>
          </PermissionGate>
          <PermissionGate permission={PERM_VEHICLES_DELETE}>
            <Button variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => onDelete(row.original)}><Trash2 className="size-3.5" /></Button>
          </PermissionGate>
        </div>
      ),
    },
  ]
}

export function VehiclesPage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [vehicleMode, setVehicleMode] = useState<VehicleDialogMode>("create")
  const [editingVehicle, setEditingVehicle] = useState<AdminVehicle | null>(null)
  const [historyVehicle, setHistoryVehicle] = useState<AdminVehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<AdminVehicle | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<string | null>(null)

  const vehicleQueryParams = useMemo(() => ({
    search: deferredSearch.trim() || undefined,
    status: status === "all" ? undefined : status,
    vehicle_category_id: categoryFilter === "all" ? undefined : categoryFilter,
  }), [categoryFilter, deferredSearch, status])

  const { data: categories = EMPTY_CATEGORIES } = useGetVehicleCategoriesQuery()
  const { data: vehicles = EMPTY_VEHICLES, isLoading, isFetching, error, refetch } = useGetVehiclesQuery(vehicleQueryParams)
  const { data: mileageHistory = [], isLoading: isHistoryLoading } = useGetVehicleMileageHistoryQuery(historyVehicle?.id ?? "", { skip: !historyVehicle })
  const [createVehicle, { isLoading: isCreatingVehicle }] = useCreateVehicleMutation()
  const [updateVehicle, { isLoading: isUpdatingVehicle }] = useUpdateVehicleMutation()
  const [deleteVehicle, { isLoading: isDeletingVehicle }] = useDeleteVehicleMutation()
  const [bulkDeleteVehicles, { isLoading: isBulkDeleting }] = useBulkDeleteVehiclesMutation()
  const [bulkUpdateStatus, { isLoading: isBulkUpdating }] = useBulkUpdateVehicleStatusMutation()

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error, "Impossible de charger les vehicules."))
  }, [error])

  useEffect(() => {
    setSelectedVehicleIds((current) => {
      const next = current.filter((id) => vehicles.some((vehicle) => String(vehicle.id) === id))
      if (next.length === current.length && next.every((id, index) => id === current[index])) return current
      return next
    })
  }, [vehicles])

  const toggleAllVehicles = (checked: boolean) => setSelectedVehicleIds(checked ? vehicles.map((vehicle) => String(vehicle.id)) : [])
  const toggleVehicle = (id: string, checked: boolean) => setSelectedVehicleIds((current) => checked ? Array.from(new Set([...current, id])) : current.filter((value) => value !== id))

  const vehicleColumns = useMemo(() => getVehicleColumns({
    selectedIds: selectedVehicleIds,
    onToggleAll: toggleAllVehicles,
    onToggleOne: toggleVehicle,
    onHistory: setHistoryVehicle,
    onEdit: (vehicle) => {
      setVehicleMode("edit")
      setEditingVehicle(vehicle)
      setVehicleDialogOpen(true)
    },
    onDelete: setDeletingVehicle,
  }), [selectedVehicleIds, vehicles])

  const handleVehicleSubmit = async (payload: VehicleFormRequest) => {
    try {
      if (vehicleMode === "create") {
        await createVehicle(payload).unwrap()
        toast.success("Vehicule cree avec succes.")
      } else if (editingVehicle) {
        await updateVehicle({ vehicleId: editingVehicle.id, ...payload }).unwrap()
        toast.success("Vehicule mis a jour.")
      }
      setVehicleDialogOpen(false)
      setEditingVehicle(null)
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Impossible d'enregistrer le vehicule."))
    }
  }

  const handleDeleteVehicle = async () => {
    if (!deletingVehicle) return
    try {
      await deleteVehicle(deletingVehicle.id).unwrap()
      toast.success("Vehicule supprime.")
      setDeletingVehicle(null)
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Impossible de supprimer le vehicule."))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteVehicles({ vehicle_ids: selectedVehicleIds }).unwrap()
      toast.success(`${selectedVehicleIds.length} vehicule(s) supprime(s).`)
      setSelectedVehicleIds([])
      setBulkDeleteOpen(false)
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Impossible de supprimer les vehicules."))
    }
  }

  const handleBulkStatus = async () => {
    if (!bulkStatus) return
    try {
      await bulkUpdateStatus({ vehicle_ids: selectedVehicleIds, status: bulkStatus }).unwrap()
      toast.success("Statuts mis a jour.")
      setSelectedVehicleIds([])
      setBulkStatus(null)
    } catch (statusError) {
      toast.error(getErrorMessage(statusError, "Impossible de modifier les statuts."))
    }
  }

  const selectedCount = selectedVehicleIds.length

  return (
    <ListPageShell
      badge="Flotte"
      title="Vehicules"
      description="Gestion de la flotte, documents administratifs, photos, tarifs et disponibilite."
      action={
        <PermissionGate permission={PERM_VEHICLES_CREATE}>
          <Button className="w-full md:w-auto" onClick={() => { setVehicleMode("create"); setEditingVehicle(null); setVehicleDialogOpen(true) }}>
            <Plus className="size-4" />
            Ajouter un vehicule
          </Button>
        </PermissionGate>
      }
    >
      <div className="grid gap-4">
        <Card className="brand-panel border-border/70">
          <CardHeader className="gap-3 border-b border-border/70 pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Car className="size-4 text-primary" />Liste des vehicules</CardTitle>
                <CardDescription>{vehicles.length} vehicule(s) affiches.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative min-w-[240px]">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher matricule, marque..." className="pl-9" />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full lg:w-[170px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {vehicleStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full lg:w-[190px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes categories</SelectItem>
                    {categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}><RefreshCcw className={cn("size-4", isFetching && "animate-spin")} /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {selectedCount > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                <Badge variant="outline" className="rounded-full">{selectedCount} selectionne(s)</Badge>
                <PermissionGate permission={PERM_VEHICLES_EDIT}>
                  {vehicleStatuses.map((item) => (
                    <Button key={item.value} size="sm" variant="outline" onClick={() => setBulkStatus(item.value)}>{item.label}</Button>
                  ))}
                </PermissionGate>
                <PermissionGate permission={PERM_VEHICLES_DELETE}>
                  <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}><Trash2 className="size-3.5" />Supprimer</Button>
                </PermissionGate>
              </div>
            ) : null}
            {isLoading ? (
              <div className="flex h-52 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <DataTable columns={vehicleColumns} data={vehicles} emptyMessage="Aucun vehicule ne correspond aux filtres." />
            )}
          </CardContent>
        </Card>
      </div>

      <VehicleDialog open={vehicleDialogOpen} mode={vehicleMode} vehicle={editingVehicle} categories={categories} isSaving={isCreatingVehicle || isUpdatingVehicle} onOpenChange={setVehicleDialogOpen} onSubmit={handleVehicleSubmit} />
      <MileageHistoryDialog vehicle={historyVehicle} history={mileageHistory} isLoading={isHistoryLoading} onOpenChange={(open) => { if (!open) setHistoryVehicle(null) }} />
      <ConfirmDialog open={Boolean(deletingVehicle)} title="Supprimer le vehicule" description={deletingVehicle ? `Confirmez la suppression de ${deletingVehicle.registration_number}.` : "Confirmez la suppression."} confirmLabel="Supprimer" destructive isLoading={isDeletingVehicle} onOpenChange={(open) => { if (!open) setDeletingVehicle(null) }} onConfirm={handleDeleteVehicle} />
      <ConfirmDialog open={bulkDeleteOpen} title={`Supprimer ${selectedCount} vehicule(s)`} description="Cette action supprimera les vehicules selectionnes et leurs documents." confirmLabel="Supprimer" destructive isLoading={isBulkDeleting} onOpenChange={setBulkDeleteOpen} onConfirm={handleBulkDelete} />
      <ConfirmDialog open={Boolean(bulkStatus)} title="Modifier le statut" description={`${selectedCount} vehicule(s) passeront au statut ${bulkStatus ? statusLabel(bulkStatus) : ""}.`} confirmLabel="Confirmer" isLoading={isBulkUpdating} onOpenChange={(open) => { if (!open) setBulkStatus(null) }} onConfirm={handleBulkStatus} />
    </ListPageShell>
  )
}
