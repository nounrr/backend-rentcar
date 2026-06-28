"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CalendarRange,
  Camera,
  Car,
  Check,
  CheckCheck,
  Gauge,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileText,
  FileSignature,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCcw,
  Search,
  Table2,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Wallet,
  X,
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
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  PERM_RESERVATIONS_CREATE,
  PERM_RESERVATIONS_DELETE,
  PERM_RESERVATIONS_EDIT,
} from "@/lib/permissions"
import type {
  AdminReservation,
  NewClientPayload,
  PaymentStatus,
  ReservationFormRequest,
  ReservationId,
  ReservationStatus,
} from "@/store/api/reservations"
import {
  useBulkDeleteReservationsMutation,
  useCompleteReservationMutation,
  useCreateReservationMutation,
  useDeleteReservationMutation,
  useGetReservationsQuery,
  useUpdateReservationMutation,
  useUpdateReservationStatusMutation,
} from "@/store/api/reservations"
import { useGetCustomersQuery } from "@/store/api/customers"
import type { AdminCustomer } from "@/store/api/customers"
import { useGetVehiclesQuery } from "@/store/api/vehicles"
import type { AdminVehicle } from "@/store/api/vehicles"
import type { CreatePaymentRequest, Payment, PaymentMethod, PaymentType } from "@/store/api/payments"
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentsQuery,
} from "@/store/api/payments"
import { useGenerateDocumentMutation, useGetTemplatesQuery } from "@/store/api/documents"
import type { DocumentType, TemplateId } from "@/store/api/documents"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error && typeof error === "object") {
    const candidate = error as { data?: { message?: unknown }; error?: string }
    if (typeof candidate.data?.message === "string") return candidate.data.message
    if (typeof candidate.error === "string") return candidate.error
  }
  return fallback
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

function formatKm(value?: number | null) {
  if (value === undefined || value === null) return "â€”"
  return `${value.toLocaleString("fr-FR")} km`
}

function formatAmount(value?: number | string | null) {
  if (value === undefined || value === null) return "—"
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", minimumFractionDigits: 0 }).format(Number(value))
}

function reservationCreatedTime(reservation: AdminReservation) {
  const createdAt = reservation.created_at ? new Date(reservation.created_at).getTime() : Number.NaN
  if (!Number.isNaN(createdAt)) return createdAt
  return Number(reservation.id) || 0
}

function printHtml(html: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1000,height=800")
  if (!printWindow) {
    toast.error("Impossible d'ouvrir la fenetre d'impression. Verifiez le bloqueur de pop-up.")
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.setTimeout(() => {
    printWindow.print()
  }, 350)
}

// ─── Constantes labels / styles ───────────────────────────────────────────────

const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  active: "En cours",
  completed: "Terminee",
  cancelled: "Annulee",
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "En attente",
  partial: "Partiel",
  paid: "Payee",
  refunded: "Rembourse",
}

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  deposit: "Acompte",
  partial: "Paiement partiel",
  full: "Paiement complet",
  refund: "Remboursement",
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Especes",
  card: "Carte bancaire",
  transfer: "Virement",
  check: "Cheque",
}

const RESERVATION_STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  confirmed: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  completed: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  partial: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  refunded: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
}

const PAYMENT_TYPE_STYLES: Record<PaymentType, string> = {
  deposit: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  partial: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  full: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  refund: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

const CALENDAR_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  active: "bg-emerald-500",
  completed: "bg-violet-500",
  cancelled: "bg-rose-500",
}

// ─── Types form ───────────────────────────────────────────────────────────────

type ViewMode = "table" | "calendar"
type DialogMode = "create" | "edit"
type ClientMode = "existing" | "new"
type ReservationStep = "client" | "booking" | "review"

const EMPTY_RESERVATIONS: AdminReservation[] = []

const RESERVATION_STEPS: Array<{ id: ReservationStep; label: string; icon: typeof UserRound }> = [
  { id: "client", label: "Client", icon: UserRound },
  { id: "booking", label: "Periode & Vehicule", icon: CalendarRange },
  { id: "review", label: "Validation", icon: Check },
]

type ReservationFormState = {
  clientMode: ClientMode
  client_id: string
  new_client: NewClientPayload
  vehicle_id: string
  start_date: string
  end_date: string
  pickup_time: string
  return_time: string
  pickup_location: string
  return_location: string
  price_per_day: string
  deposit_amount: string
  deposit_payment_method: PaymentMethod
  guarantee_amount: string
  guarantee_payment_method: PaymentMethod
  payment_status: PaymentStatus
  reservation_status: ReservationStatus
  notes: string
}

const emptyNewClient: NewClientPayload = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  nationality: "Marocaine",
  cin: "",
  passport: "",
  driving_license_number: "",
  driving_license_issued_at: "",
  driving_license_expires_at: "",
  driving_license_scan: null,
  driving_license_back_scan: null,
  identity_document_scan: null,
  identity_document_back_scan: null,
  password: "password",
  is_active: true,
}

const emptyForm: ReservationFormState = {
  clientMode: "existing",
  client_id: "",
  new_client: emptyNewClient,
  vehicle_id: "",
  start_date: "",
  end_date: "",
  pickup_time: "",
  return_time: "",
  pickup_location: "",
  return_location: "",
  price_per_day: "",
  deposit_amount: "",
  deposit_payment_method: "cash",
  guarantee_amount: "",
  guarantee_payment_method: "cash",
  payment_status: "pending",
  reservation_status: "pending",
  notes: "",
}

function reservationToForm(r: AdminReservation | null): ReservationFormState {
  if (!r) return emptyForm
  return {
    clientMode: "existing",
    client_id: String(r.client_id),
    new_client: emptyNewClient,
    vehicle_id: String(r.vehicle_id),
    start_date: r.start_date?.slice(0, 10) ?? "",
    end_date: r.end_date?.slice(0, 10) ?? "",
    pickup_time: r.pickup_time ?? "",
    return_time: r.return_time ?? "",
    pickup_location: r.pickup_location ?? "",
    return_location: r.return_location ?? "",
    price_per_day: String(r.price_per_day ?? ""),
    deposit_amount: String(r.deposit_amount ?? ""),
    deposit_payment_method: "cash",
    guarantee_amount: String(r.guarantee_amount ?? ""),
    guarantee_payment_method: (r.guarantee_payment_method ?? "cash") as PaymentMethod,
    payment_status: r.payment_status,
    reservation_status: r.reservation_status,
    notes: r.notes ?? "",
  }
}

function buildPayload(form: ReservationFormState): ReservationFormRequest {
  const base: ReservationFormRequest = {
    vehicle_id: Number(form.vehicle_id),
    start_date: form.start_date,
    end_date: form.end_date,
    pickup_time: form.pickup_time || undefined,
    return_time: form.return_time || undefined,
    pickup_location: form.pickup_location.trim() || undefined,
    return_location: form.return_location.trim() || undefined,
    price_per_day: Number(form.price_per_day),
    deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : undefined,
    deposit_payment_method: form.deposit_amount && Number(form.deposit_amount) > 0 ? form.deposit_payment_method : undefined,
    guarantee_amount: form.guarantee_amount ? Number(form.guarantee_amount) : undefined,
    guarantee_payment_method: form.guarantee_amount && Number(form.guarantee_amount) > 0 ? form.guarantee_payment_method : undefined,
    payment_status: form.payment_status,
    reservation_status: form.reservation_status,
    notes: form.notes.trim() || undefined,
  }
  if (form.clientMode === "existing") {
    base.client_id = Number(form.client_id)
  } else {
    base.new_client = {
      full_name: form.new_client.full_name.trim(),
      phone: form.new_client.phone.trim(),
      email: form.new_client.email?.trim() || undefined,
      address: form.new_client.address?.trim() || undefined,
      city: form.new_client.city?.trim() || undefined,
      nationality: form.new_client.nationality?.trim() || undefined,
      cin: form.new_client.cin?.trim() || undefined,
      passport: form.new_client.passport?.trim() || undefined,
      driving_license_number: form.new_client.driving_license_number?.trim() || undefined,
      driving_license_issued_at: form.new_client.driving_license_issued_at || undefined,
      driving_license_expires_at: form.new_client.driving_license_expires_at || undefined,
      driving_license_scan: form.new_client.driving_license_scan ?? undefined,
      driving_license_back_scan: form.new_client.driving_license_back_scan ?? undefined,
      identity_document_scan: form.new_client.identity_document_scan ?? undefined,
      identity_document_back_scan: form.new_client.identity_document_back_scan ?? undefined,
      password: form.new_client.password?.trim() || "password",
      is_active: true,
    }
  }
  return base
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, description, confirmLabel, isLoading, destructive, onOpenChange, onConfirm,
}: {
  open: boolean; title: string; description: string; confirmLabel: string
  isLoading: boolean; destructive?: boolean
  onOpenChange: (v: boolean) => void; onConfirm: () => Promise<void>
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

// ─── ReservationDialog ────────────────────────────────────────────────────────

function formatFileLabel(file?: File | null) {
  if (!file) return "Aucun fichier"
  const size = file.size >= 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
    : `${Math.max(1, Math.round(file.size / 1024))} Ko`
  return `${file.name} - ${size}`
}

function asFile(value: unknown) {
  return value instanceof File ? value : null
}

function DocumentCaptureField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value?: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background p-3">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{formatFileLabel(value)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <input
              id={`${id}-upload`}
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              className="sr-only"
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor={`${id}-upload`}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Upload className="size-4" />
              Importer
            </label>
            <input
              id={`${id}-camera`}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor={`${id}-camera`}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Camera className="size-4" />
              Camera
            </label>
          </div>
        </div>
        {value ? (
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => onChange(null)}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function customerOption(customer: AdminCustomer): SearchableSelectOption {
  return {
    value: String(customer.id),
    label: customer.full_name,
    description: [customer.phone, customer.email, customer.cin].filter(Boolean).join(" - "),
    searchText: [customer.full_name, customer.phone, customer.email, customer.cin, customer.passport].filter(Boolean).join(" "),
  }
}

function vehicleLabel(vehicle: Pick<AdminVehicle, "brand" | "model" | "registration_number" | "is_subcontracted">) {
  return `${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})${vehicle.is_subcontracted ? " - Vehicule reloue" : ""}`
}

function vehicleOption(vehicle: AdminVehicle): SearchableSelectOption {
  return {
    value: String(vehicle.id),
    label: vehicleLabel(vehicle),
    description: `${formatAmount(vehicle.daily_rental_price)}/j`,
    badge: vehicle.is_subcontracted ? "Reloue" : undefined,
    searchText: [vehicle.brand, vehicle.model, vehicle.registration_number, vehicle.color, vehicle.status].filter(Boolean).join(" "),
  }
}

function SubcontractRentalSummary({
  vehicle,
  days,
  clientDailyPrice,
}: {
  vehicle: Pick<AdminVehicle, "is_subcontracted" | "subcontract_daily_cost" | "daily_rental_price">
  days: number
  clientDailyPrice: number
}) {
  if (!vehicle.is_subcontracted) return null

  const realDailyCost = Number(vehicle.subcontract_daily_cost || 0)
  const dailyProfit = clientDailyPrice - realDailyCost
  const clientTotal = days * clientDailyPrice
  const realTotal = days * realDailyCost
  const totalProfit = clientTotal - realTotal

  return (
    <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className="bg-sky-600 text-white hover:bg-sky-600">Vehicule reloue</Badge>
        <span className="font-medium">Calcul du benefice</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <span className="text-muted-foreground">Prix reel/jour: <strong className="text-foreground">{formatAmount(realDailyCost)}</strong></span>
        <span className="text-muted-foreground">Prix client/jour: <strong className="text-foreground">{formatAmount(clientDailyPrice)}</strong></span>
        <span className="text-muted-foreground">Benefice/jour: <strong className={dailyProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>{formatAmount(dailyProfit)}</strong></span>
        <span className="text-muted-foreground">Total location: <strong className="text-foreground">{formatAmount(clientTotal)}</strong></span>
        <span className="text-muted-foreground">Total cout reel: <strong className="text-foreground">{formatAmount(realTotal)}</strong></span>
        <span className="text-muted-foreground">Benefice total: <strong className={totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>{formatAmount(totalProfit)}</strong></span>
      </div>
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */
function ReservationDialog({
  open, mode, reservation, isSaving, onOpenChange, onSubmit,
}: {
  open: boolean; mode: DialogMode; reservation: AdminReservation | null
  isSaving: boolean; onOpenChange: (v: boolean) => void
  onSubmit: (payload: ReservationFormRequest) => Promise<void>
}) {
  const [form, setForm] = useState<ReservationFormState>(emptyForm)
  const { data: customers = [] } = useGetCustomersQuery()
  const { data: vehicles = [] } = useGetVehiclesQuery()

  useEffect(() => { if (!open) return; setForm(reservationToForm(reservation)) }, [reservation, open])

  const set = (patch: Partial<ReservationFormState>) => setForm((f) => ({ ...f, ...patch }))
  const setNewClient = (patch: Partial<NewClientPayload>) =>
    setForm((f) => ({ ...f, new_client: { ...f.new_client, ...patch } }))

  const calcDays = () => {
    if (!form.start_date || !form.end_date) return 0
    return Math.max(0, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))
  }

  const isInvalid =
    (form.clientMode === "existing" ? !form.client_id : !form.new_client.full_name.trim() || !form.new_client.phone.trim()) ||
    !form.vehicle_id || !form.start_date || !form.end_date || !form.price_per_day

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:h-[min(90dvh,840px)] sm:max-w-[820px]">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <DialogTitle>{mode === "create" ? "Nouvelle reservation" : "Modifier la reservation"}</DialogTitle>
          <DialogDescription>Renseignez les details de la location de vehicule.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-5">

            {/* Client */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Client</h3>
              </div>
              {mode === "create" && (
                <div className="flex gap-2">
                  <Button size="sm" variant={form.clientMode === "existing" ? "default" : "outline"} onClick={() => set({ clientMode: "existing" })} type="button">
                    <UserRound className="size-3.5" />Client existant
                  </Button>
                  <Button size="sm" variant={form.clientMode === "new" ? "default" : "outline"} onClick={() => set({ clientMode: "new" })} type="button">
                    <UserPlus className="size-3.5" />Nouveau client
                  </Button>
                </div>
              )}
              {form.clientMode === "existing" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selectionner le client *</label>
                  <Select value={form.client_id} onValueChange={(v) => set({ client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir un client..." /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>{c.full_name} — {c.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Nouveau client</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-sm font-medium">Nom complet *</label><Input value={form.new_client.full_name} onChange={(e) => setNewClient({ full_name: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Telephone *</label><Input value={form.new_client.phone} onChange={(e) => setNewClient({ phone: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Email</label><Input type="email" value={form.new_client.email} onChange={(e) => setNewClient({ email: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Ville</label><Input value={form.new_client.city} onChange={(e) => setNewClient({ city: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Nationalite</label><Input value={form.new_client.nationality} onChange={(e) => setNewClient({ nationality: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">CIN</label><Input value={form.new_client.cin} onChange={(e) => setNewClient({ cin: e.target.value })} placeholder="Marocains" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Passeport</label><Input value={form.new_client.passport} onChange={(e) => setNewClient({ passport: e.target.value })} placeholder="Etrangers" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">No. permis</label><Input value={form.new_client.driving_license_number} onChange={(e) => setNewClient({ driving_license_number: e.target.value })} /></div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="opacity-50" />

            {/* Vehicule */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Car className="size-4 text-primary" /><h3 className="text-sm font-semibold">Vehicule</h3></div>
              <Select value={form.vehicle_id} onValueChange={(v) => {
                const veh = vehicles.find((x) => String(x.id) === v)
                set({ vehicle_id: v, price_per_day: veh ? String(veh.daily_rental_price) : form.price_per_day })
              }}>
                <SelectTrigger><SelectValue placeholder="Choisir un vehicule..." /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={String(v.id)} value={String(v.id)}>
                      {v.brand} {v.model} ({v.registration_number}) — {formatAmount(v.daily_rental_price)}/j
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="opacity-50" />

            {/* Periode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><CalendarRange className="size-4 text-primary" /><h3 className="text-sm font-semibold">Periode de location</h3></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><label className="text-sm font-medium">Date de depart *</label><Input type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Date de retour *</label><Input type="date" value={form.end_date} min={form.start_date} onChange={(e) => set({ end_date: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Heure de prise en charge</label><Input type="time" value={form.pickup_time} onChange={(e) => set({ pickup_time: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Heure de retour</label><Input type="time" value={form.return_time} onChange={(e) => set({ return_time: e.target.value })} /></div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Lieux */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /><h3 className="text-sm font-semibold">Lieux</h3></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><label className="text-sm font-medium">Lieu de prise en charge</label><Input value={form.pickup_location} onChange={(e) => set({ pickup_location: e.target.value })} placeholder="Agence, aeroport..." /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Lieu de retour</label><Input value={form.return_location} onChange={(e) => set({ return_location: e.target.value })} placeholder="Agence, hotel..." /></div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Tarification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><CircleDollarSign className="size-4 text-primary" /><h3 className="text-sm font-semibold">Tarification & statuts</h3></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><label className="text-sm font-medium">Prix par jour (MAD) *</label><Input type="number" min="0" step="0.01" value={form.price_per_day} onChange={(e) => set({ price_per_day: e.target.value })} placeholder="0.00" /></div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Acompte initial (MAD)</label>
                  <Input type="number" min="0" step="0.01" value={form.deposit_amount} onChange={(e) => set({ deposit_amount: e.target.value })} placeholder="0.00" />
                  <p className="text-xs text-muted-foreground">Montant deja encaisse lors de la reservation</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Statut de paiement</label>
                  <Select value={form.payment_status} onValueChange={(v: PaymentStatus) => set({ payment_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Statut de reservation</label>
                  <Select value={form.reservation_status} onValueChange={(v: ReservationStatus) => set({ reservation_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RESERVATION_STATUS_LABELS) as ReservationStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{RESERVATION_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.start_date && form.end_date && form.price_per_day && (
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{calcDays()} jour{calcDays() > 1 ? "s" : ""}</span>
                  <span className="text-muted-foreground">×</span>
                  <span>{formatAmount(Number(form.price_per_day))}/j</span>
                  <span className="ml-auto font-semibold text-primary">
                    Total : {formatAmount(calcDays() * Number(form.price_per_day))}
                  </span>
                </div>
              )}
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Informations complementaires..." />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
          <Button onClick={() => onSubmit(buildPayload(form))} disabled={isSaving || isInvalid}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Creer la reservation" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── PaymentsPanel (Sheet lateral) ───────────────────────────────────────────

type PaymentFormState = {
  amount: string
  type: PaymentType
  method: PaymentMethod
  paid_at: string
  reference: string
  notes: string
}

const emptyPaymentForm: PaymentFormState = {
  amount: "",
  type: "full",
  method: "cash",
  paid_at: new Date().toISOString().slice(0, 10),
  reference: "",
  notes: "",
}

/* eslint-enable @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */

function ReservationWizardDialog({
  open, mode, reservation, isSaving, onOpenChange, onSubmit,
}: {
  open: boolean; mode: DialogMode; reservation: AdminReservation | null
  isSaving: boolean; onOpenChange: (v: boolean) => void
  onSubmit: (payload: ReservationFormRequest) => Promise<void>
}) {
  const [form, setForm] = useState<ReservationFormState>(emptyForm)
  const [currentStep, setCurrentStep] = useState<ReservationStep>("client")
  const { data: customers = [] } = useGetCustomersQuery()
  const { data: vehicles = [] } = useGetVehiclesQuery()
  const { data: allReservations = EMPTY_RESERVATIONS } = useGetReservationsQuery()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setForm(reservationToForm(reservation))
      setCurrentStep("client")
    })
    return () => {
      cancelled = true
    }
  }, [reservation, open])

  const availableVehicles = useMemo(() => {
    if (!form.start_date || !form.end_date) return [] as typeof vehicles
    const startMs = new Date(form.start_date).getTime()
    const endMs = new Date(form.end_date).getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return [] as typeof vehicles
    const editingId = reservation?.id
    const blockingStatuses: ReservationStatus[] = ["pending", "confirmed", "active"]
    const busyVehicleIds = new Set<number>()
    for (const r of allReservations) {
      if (editingId != null && r.id === editingId) continue
      if (!blockingStatuses.includes(r.reservation_status)) continue
      const rStart = new Date(r.start_date).getTime()
      const rEnd = new Date(r.end_date).getTime()
      if (Number.isNaN(rStart) || Number.isNaN(rEnd)) continue
      const overlaps = rStart <= endMs && rEnd >= startMs
      if (overlaps) busyVehicleIds.add(Number(r.vehicle_id))
    }
    return vehicles.filter((v) => !busyVehicleIds.has(Number(v.id)))
  }, [allReservations, vehicles, form.start_date, form.end_date, reservation?.id])

  const set = (patch: Partial<ReservationFormState>) => setForm((f) => ({ ...f, ...patch }))
  const setNewClient = (patch: Partial<NewClientPayload>) =>
    setForm((f) => ({ ...f, new_client: { ...f.new_client, ...patch } }))

  const days = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0
    return Math.max(0, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))
  }, [form.start_date, form.end_date])

  const selectedCustomer = customers.find((c) => String(c.id) === form.client_id)
  const selectedVehicle = vehicles.find((v) => String(v.id) === form.vehicle_id)
  const customerOptions = useMemo(() => customers.map(customerOption), [customers])
  const vehicleOptions = useMemo(() => availableVehicles.map(vehicleOption), [availableVehicles])
  const stepIndex = RESERVATION_STEPS.findIndex((step) => step.id === currentStep)
  const totalAmount = days * Number(form.price_per_day || 0)
  const realDailyCost = Number(selectedVehicle?.subcontract_daily_cost || 0)
  const subcontractTotalCost = selectedVehicle?.is_subcontracted ? days * realDailyCost : 0
  const subcontractProfit = selectedVehicle?.is_subcontracted ? totalAmount - subcontractTotalCost : 0
  const hasIdentityNumber = Boolean(form.new_client.cin?.trim() || form.new_client.passport?.trim())

  const isClientValid = form.clientMode === "existing"
    ? Boolean(form.client_id)
    : Boolean(
        form.new_client.full_name.trim() &&
        form.new_client.phone.trim() &&
        form.new_client.email?.trim() &&
        form.new_client.address?.trim() &&
        form.new_client.city?.trim() &&
        form.new_client.nationality?.trim() &&
        hasIdentityNumber &&
        form.new_client.driving_license_number?.trim() &&
        form.new_client.driving_license_issued_at &&
        form.new_client.driving_license_expires_at
      )

  const isInvalid = !isClientValid || !form.vehicle_id || !form.start_date || !form.end_date || !form.price_per_day
  const canGoNext =
    currentStep === "client" ? isClientValid :
    currentStep === "booking" ? Boolean(form.start_date && form.end_date && form.vehicle_id && form.price_per_day) :
    !isInvalid

  const documentFields: Array<{ id: string; label: string; key: keyof NewClientPayload }> = [
    { id: "identity-front", label: "CIN / passeport recto", key: "identity_document_scan" },
    { id: "identity-back", label: "CIN / passeport verso", key: "identity_document_back_scan" },
    { id: "license-front", label: "Permis recto", key: "driving_license_scan" },
    { id: "license-back", label: "Permis verso", key: "driving_license_back_scan" },
  ]

  const goNext = () => {
    if (!canGoNext) return
    setCurrentStep(RESERVATION_STEPS[Math.min(stepIndex + 1, RESERVATION_STEPS.length - 1)].id)
  }

  const goPrevious = () => {
    setCurrentStep(RESERVATION_STEPS[Math.max(stepIndex - 1, 0)].id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(92dvh,860px)] sm:max-w-[960px] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border/70 px-4 py-4 text-left sm:px-6 sm:py-5">
          <DialogTitle>{mode === "create" ? "Nouvelle reservation" : "Modifier la reservation"}</DialogTitle>
          <DialogDescription>Creation en etapes avec client, documents, vehicule et paiement.</DialogDescription>
        </DialogHeader>

        <div className="shrink-0 overflow-x-auto border-b border-border/70 px-3 py-3 sm:px-6">
          <div className="flex min-w-max gap-2">
            {RESERVATION_STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = step.id === currentStep
              const isDone = index < stepIndex
              const canOpen = index <= stepIndex || (index === stepIndex + 1 && canGoNext)

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!canOpen}
                  onClick={() => canOpen && setCurrentStep(step.id)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isDone && !isActive && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    !isActive && !isDone && "border-border bg-background text-muted-foreground",
                    !canOpen && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isDone ? <Check className="size-4" /> : <StepIcon className="size-4" />}
                  <span>{step.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-4 py-5 sm:px-6">
            {currentStep === "client" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">Client</h3>
                </div>
                {mode === "create" && (
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <Button className="w-full sm:w-auto" size="sm" variant={form.clientMode === "existing" ? "default" : "outline"} onClick={() => set({ clientMode: "existing" })} type="button">
                      <UserRound className="size-3.5" />Client existant
                    </Button>
                    <Button className="w-full sm:w-auto" size="sm" variant={form.clientMode === "new" ? "default" : "outline"} onClick={() => set({ clientMode: "new" })} type="button">
                      <UserPlus className="size-3.5" />Nouveau client
                    </Button>
                  </div>
                )}
                {form.clientMode === "existing" ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Selectionner le client *</label>
                    <SearchableSelect
                      value={form.client_id}
                      options={customerOptions}
                      onValueChange={(v) => set({ client_id: v })}
                      placeholder="Choisir un client..."
                      searchPlaceholder="Rechercher nom, telephone, email, CIN..."
                      emptyMessage="Aucun client trouve."
                    />
                    {selectedCustomer ? (
                      <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm sm:grid-cols-2">
                        <span><strong>Telephone:</strong> {selectedCustomer.phone}</span>
                        <span><strong>Email:</strong> {selectedCustomer.email}</span>
                        <span><strong>CIN:</strong> {selectedCustomer.cin ?? "-"}</span>
                        <span><strong>Permis:</strong> {selectedCustomer.driving_license_number}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-lg border border-border/70 bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Informations client</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5"><label className="text-sm font-medium">Nom complet *</label><Input value={form.new_client.full_name} onChange={(e) => setNewClient({ full_name: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">Telephone *</label><Input value={form.new_client.phone} onChange={(e) => setNewClient({ phone: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">Email *</label><Input type="email" value={form.new_client.email} onChange={(e) => setNewClient({ email: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">Ville *</label><Input value={form.new_client.city} onChange={(e) => setNewClient({ city: e.target.value })} /></div>
                      <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Adresse *</label><Input value={form.new_client.address} onChange={(e) => setNewClient({ address: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">Nationalite *</label><Input value={form.new_client.nationality} onChange={(e) => setNewClient({ nationality: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">CIN</label><Input value={form.new_client.cin} onChange={(e) => setNewClient({ cin: e.target.value })} placeholder="Marocains" /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">Passeport</label><Input value={form.new_client.passport} onChange={(e) => setNewClient({ passport: e.target.value })} placeholder="Etrangers" /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">No. permis *</label><Input value={form.new_client.driving_license_number} onChange={(e) => setNewClient({ driving_license_number: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">Permis delivre le *</label><Input type="date" value={form.new_client.driving_license_issued_at} onChange={(e) => setNewClient({ driving_license_issued_at: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-sm font-medium">Permis expire le *</label><Input type="date" value={form.new_client.driving_license_expires_at} min={form.new_client.driving_license_issued_at} onChange={(e) => setNewClient({ driving_license_expires_at: e.target.value })} /></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</p>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {documentFields.map((field) => (
                          <DocumentCaptureField
                            key={field.id}
                            id={field.id}
                            label={field.label}
                            value={asFile(form.new_client[field.key])}
                            onChange={(file) => setNewClient({ [field.key]: file } as Partial<NewClientPayload>)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === "booking" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2"><CalendarRange className="size-4 text-primary" /><h3 className="text-sm font-semibold">Periode de location</h3></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-sm font-medium">Date de depart *</label><Input type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value, vehicle_id: "" })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Date de retour *</label><Input type="date" value={form.end_date} min={form.start_date} onChange={(e) => set({ end_date: e.target.value, vehicle_id: "" })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Heure de prise en charge</label><Input type="time" value={form.pickup_time} onChange={(e) => set({ pickup_time: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Heure de retour</label><Input type="time" value={form.return_time} onChange={(e) => set({ return_time: e.target.value })} /></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-sm font-medium">Lieu de prise en charge</label><Input value={form.pickup_location} onChange={(e) => set({ pickup_location: e.target.value })} placeholder="Agence, aeroport..." /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Lieu de retour</label><Input value={form.return_location} onChange={(e) => set({ return_location: e.target.value })} placeholder="Agence, hotel..." /></div>
                  </div>
                </div>

                {form.start_date && form.end_date ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2"><Car className="size-4 text-primary" /><h3 className="text-sm font-semibold">Vehicule disponible</h3></div>
                    {availableVehicles.length === 0 ? (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        Aucun vehicule disponible pour cette periode.
                      </div>
                    ) : (
                      <SearchableSelect
                        value={form.vehicle_id}
                        options={vehicleOptions}
                        onValueChange={(v) => {
                          const veh = availableVehicles.find((x) => String(x.id) === v)
                          set({ vehicle_id: v, price_per_day: veh ? String(veh.daily_rental_price) : form.price_per_day })
                        }}
                        placeholder="Choisir un vehicule..."
                        searchPlaceholder="Rechercher matricule, marque, modele..."
                        emptyMessage="Aucun vehicule trouve."
                        renderOption={(option) => (
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{option.label}</span>
                              {option.badge ? <Badge variant="secondary">{option.badge}</Badge> : null}
                            </div>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        )}
                      />
                    )}
                    {selectedVehicle ? (
                      <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/30 p-4 text-sm sm:grid-cols-2">
                        <span><strong>Marque:</strong> {selectedVehicle.brand} {selectedVehicle.model}</span>
                        <span><strong>Immatriculation:</strong> {selectedVehicle.registration_number}</span>
                        <span><strong>Couleur:</strong> {selectedVehicle.color}</span>
                        <span><strong>Prix/jour:</strong> {formatAmount(selectedVehicle.daily_rental_price)}</span>
                      </div>
                    ) : null}
                    {selectedVehicle ? (
                      <SubcontractRentalSummary
                        vehicle={selectedVehicle}
                        days={days}
                        clientDailyPrice={Number(form.price_per_day || selectedVehicle.daily_rental_price || 0)}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                    Selectionnez d'abord les dates pour voir les vehicules disponibles.
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2"><CircleDollarSign className="size-4 text-primary" /><h3 className="text-sm font-semibold">Tarification & statuts</h3></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5"><label className="text-sm font-medium">Prix par jour (MAD) *</label><Input type="number" min="0" step="0.01" value={form.price_per_day} onChange={(e) => set({ price_per_day: e.target.value })} placeholder="0.00" /></div>
                    <div /> {/* spacer pour aligner la grille 2 colonnes */}
                    <div className="space-y-1.5"><label className="text-sm font-medium">Acompte initial (MAD)</label><Input type="number" min="0" step="0.01" value={form.deposit_amount} onChange={(e) => set({ deposit_amount: e.target.value })} placeholder="0.00" /></div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Methode de l'acompte</label>
                      <Select value={form.deposit_payment_method} onValueChange={(v: PaymentMethod) => set({ deposit_payment_method: v })} disabled={!form.deposit_amount || Number(form.deposit_amount) <= 0}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                            <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Garantie / caution (MAD)</label><Input type="number" min="0" step="0.01" value={form.guarantee_amount} onChange={(e) => set({ guarantee_amount: e.target.value })} placeholder="0.00" /></div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Methode de la garantie</label>
                      <Select value={form.guarantee_payment_method} onValueChange={(v: PaymentMethod) => set({ guarantee_payment_method: v })} disabled={!form.guarantee_amount || Number(form.guarantee_amount) <= 0}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                            <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Statut de paiement</label>
                      <Select value={form.payment_status} onValueChange={(v: PaymentStatus) => set({ payment_status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Statut de reservation</label>
                      <Select value={form.reservation_status} onValueChange={(v: ReservationStatus) => set({ reservation_status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(RESERVATION_STATUS_LABELS) as ReservationStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{RESERVATION_STATUS_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {form.start_date && form.end_date && form.price_per_day ? (
                    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">{days} jour{days > 1 ? "s" : ""}</span>
                      <span className="text-muted-foreground">x</span>
                      <span>{formatAmount(Number(form.price_per_day))}/j</span>
                      <span className="ml-auto font-semibold text-primary">Total : {formatAmount(totalAmount)}</span>
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea rows={4} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Informations complementaires..." />
                  </div>
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2"><Check className="size-4 text-primary" /><h3 className="text-sm font-semibold">Validation</h3></div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Client</p>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{form.clientMode === "existing" ? selectedCustomer?.full_name ?? reservation?.client?.full_name : form.new_client.full_name}</p>
                      <p>{form.clientMode === "existing" ? selectedCustomer?.phone ?? reservation?.client?.phone : form.new_client.phone}</p>
                      <p>{form.clientMode === "existing" ? selectedCustomer?.email ?? reservation?.client?.email : form.new_client.email}</p>
                      {form.clientMode === "new" ? <p className="text-muted-foreground">CIN/Passeport: {form.new_client.cin || form.new_client.passport || "-"}</p> : null}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Vehicule</p>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : reservation?.vehicle ? `${reservation.vehicle.brand} ${reservation.vehicle.model}` : "-"}</p>
                      <p>{selectedVehicle?.registration_number ?? reservation?.vehicle?.registration_number}</p>
                      <p className="text-muted-foreground">{formatAmount(form.price_per_day)}/jour</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Periode</p>
                    <div className="space-y-1 text-sm">
                      <p>{formatDate(form.start_date)} - {formatDate(form.end_date)}</p>
                      <p>{days} jour{days > 1 ? "s" : ""}</p>
                      <p className="text-muted-foreground">{form.pickup_location || "Depart non precise"} / {form.return_location || "Retour non precise"}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Paiement</p>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-primary">{formatAmount(totalAmount)}</p>
                      {selectedVehicle?.is_subcontracted ? (
                        <>
                          <p>Cout reel: {formatAmount(subcontractTotalCost)} ({formatAmount(realDailyCost)}/jour)</p>
                          <p className={subcontractProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>Benefice estime: {formatAmount(subcontractProfit)}</p>
                        </>
                      ) : null}
                      <p>Acompte: {formatAmount(form.deposit_amount || 0)}{form.deposit_amount && Number(form.deposit_amount) > 0 ? ` (${PAYMENT_METHOD_LABELS[form.deposit_payment_method]})` : ""}</p>
                      <p>Garantie: {formatAmount(form.guarantee_amount || 0)}{form.guarantee_amount && Number(form.guarantee_amount) > 0 ? ` (${PAYMENT_METHOD_LABELS[form.guarantee_payment_method]})` : ""}</p>
                      <p>{PAYMENT_STATUS_LABELS[form.payment_status]} - {RESERVATION_STATUS_LABELS[form.reservation_status]}</p>
                    </div>
                  </div>
                </div>
                {form.clientMode === "new" ? (
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents ajoutes</p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {documentFields.map((field) => (
                        <p key={field.id} className="truncate">{field.label}: {formatFileLabel(asFile(form.new_client[field.key]))}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 px-4 py-4 sm:px-6">
          <div className="mr-auto flex items-center text-xs text-muted-foreground">
            Etape {stepIndex + 1}/{RESERVATION_STEPS.length}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
          {stepIndex > 0 ? <Button variant="outline" onClick={goPrevious} disabled={isSaving}>Retour</Button> : null}
          {currentStep === "review" ? (
            <Button onClick={() => onSubmit(buildPayload(form))} disabled={isSaving || isInvalid}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "create" ? "Creer la reservation" : "Enregistrer"}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canGoNext || isSaving}>Suivant</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaymentsPanel({
  open,
  reservation,
  onOpenChange,
}: {
  open: boolean
  reservation: AdminReservation | null
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState<PaymentFormState>(emptyPaymentForm)
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)

  const reservationId = reservation?.id

  const {
    data,
    isLoading: isLoadingPayments,
    isFetching,
  } = useGetPaymentsQuery(reservationId!, { skip: !reservationId || !open })

  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation()
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentMutation()

  const payments = data?.payments ?? []
  const summary = data?.summary

  const set = (patch: Partial<PaymentFormState>) => setForm((f) => ({ ...f, ...patch }))

  // Auto-calcule le montant restant quand on passe en type "full"
  useEffect(() => {
    if (form.type === "full" && summary) {
      set({ amount: String(summary.remaining > 0 ? summary.remaining : "") })
    }
  }, [form.type, summary?.remaining])

  const isInvalid = !form.amount || Number(form.amount) <= 0 || !form.paid_at

  const handleSubmit = async () => {
    if (!reservationId) return
    try {
      const payload: CreatePaymentRequest = {
        amount: Number(form.amount),
        type: form.type,
        method: form.method,
        paid_at: form.paid_at,
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      await createPayment({ reservationId, ...payload }).unwrap()
      toast.success("Paiement enregistre.")
      setForm(emptyPaymentForm)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible d'enregistrer le paiement."))
    }
  }

  const handleDelete = async () => {
    if (!reservationId || !deletingPayment) return
    try {
      await deletePayment({ reservationId, paymentId: deletingPayment.id }).unwrap()
      toast.success("Paiement supprime.")
      setDeletingPayment(null)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible de supprimer le paiement."))
    }
  }

  if (!reservation) return null

  const progressPct = summary
    ? Math.min(100, (summary.net_paid / (summary.total_amount || 1)) * 100)
    : 0

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[520px]" side="right">
          <SheetHeader className="shrink-0 border-b border-border/70 px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              Paiements
            </SheetTitle>
            <SheetDescription>
              {reservation.client?.full_name} — {reservation.vehicle?.brand} {reservation.vehicle?.model}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-5 px-6 py-5">

              {/* Résumé financier */}
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total reservation</span>
                  <span className="font-semibold">{formatAmount(reservation.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600"><ArrowUpRight className="size-3.5" />Encaisse</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatAmount(summary?.net_paid ?? 0)}</span>
                </div>
                {(summary?.total_refunded ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-rose-600"><ArrowDownLeft className="size-3.5" />Rembourse</span>
                    <span className="font-medium text-rose-600">{formatAmount(summary?.total_refunded)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Restant</span>
                  <span className={cn("font-semibold", (summary?.remaining ?? 0) > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {formatAmount(summary?.remaining ?? 0)}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-border/50 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500",
                        progressPct >= 100 ? "bg-emerald-500" : progressPct > 0 ? "bg-amber-500" : "bg-muted-foreground/30"
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{progressPct.toFixed(0)}% paye</span>
                    <Badge variant="outline" className={cn("rounded-full px-2 py-0 text-[10px] font-semibold", PAYMENT_STATUS_STYLES[reservation.payment_status])}>
                      {PAYMENT_STATUS_LABELS[reservation.payment_status]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Formulaire nouveau paiement */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="size-4 text-primary" />
                  Enregistrer un paiement
                </h3>

                <div className="grid gap-3">
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Type *</label>
                      <Select value={form.type} onValueChange={(v: PaymentType) => set({ type: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              <span className="flex items-center gap-2">
                                {t === "refund" ? <ArrowDownLeft className="size-3.5 text-rose-500" /> : <ArrowUpRight className="size-3.5 text-emerald-500" />}
                                {PAYMENT_TYPE_LABELS[t]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Methode *</label>
                      <Select value={form.method} onValueChange={(v: PaymentMethod) => set({ method: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash"><span className="flex items-center gap-2"><Banknote className="size-3.5" />Especes</span></SelectItem>
                          <SelectItem value="card"><span className="flex items-center gap-2"><CreditCard className="size-3.5" />Carte</span></SelectItem>
                          <SelectItem value="transfer"><span className="flex items-center gap-2"><Wallet className="size-3.5" />Virement</span></SelectItem>
                          <SelectItem value="check"><span className="flex items-center gap-2"><Receipt className="size-3.5" />Cheque</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Montant (MAD) *</label>
                      <Input type="number" min="0.01" step="0.01" className="h-9" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Date *</label>
                      <Input type="date" className="h-9" value={form.paid_at} onChange={(e) => set({ paid_at: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Reference (optionnel)</label>
                    <Input className="h-9" value={form.reference} onChange={(e) => set({ reference: e.target.value })} placeholder="N° recu, virement..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Notes (optionnel)</label>
                    <Textarea rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Remarque..." className="text-sm" />
                  </div>

                  <Button onClick={handleSubmit} disabled={isCreating || isInvalid} className="w-full">
                    {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Enregistrer le paiement
                  </Button>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Historique */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Historique ({payments.length})</h3>
                  {isFetching && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                </div>

                {isLoadingPayments ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="rounded-xl border border-border/70 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
                    Aucun paiement enregistre
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3">
                        <div className={cn("mt-0.5 rounded-full p-1.5", p.type === "refund" ? "bg-rose-500/10" : "bg-emerald-500/10")}>
                          {p.type === "refund"
                            ? <ArrowDownLeft className="size-3.5 text-rose-500" />
                            : <ArrowUpRight className="size-3.5 text-emerald-500" />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("font-semibold", p.type === "refund" ? "text-rose-600" : "text-foreground")}>
                              {p.type === "refund" ? "-" : "+"}{formatAmount(p.amount)}
                            </span>
                            <Badge variant="outline" className={cn("rounded-full px-2 py-0 text-[10px] font-semibold", PAYMENT_TYPE_STYLES[p.type])}>
                              {PAYMENT_TYPE_LABELS[p.type]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(p.paid_at)}</span>
                            <span>·</span>
                            <span>{PAYMENT_METHOD_LABELS[p.method]}</span>
                            {p.reference && <><span>·</span><span className="font-mono">{p.reference}</span></>}
                          </div>
                          {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-rose-600"
                          onClick={() => setDeletingPayment(p)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deletingPayment)}
        title="Supprimer le paiement"
        description={deletingPayment ? `Supprimer le paiement de ${formatAmount(deletingPayment.amount)} du ${formatDate(deletingPayment.paid_at)} ?` : ""}
        confirmLabel="Supprimer"
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => { if (!open) setDeletingPayment(null) }}
        onConfirm={handleDelete}
      />
    </>
  )
}

// ─── Colonnes tableau ─────────────────────────────────────────────────────────

function getColumns({
  selectedIds, printingKey, onToggleAll, onToggleOne, onEdit, onDelete, onStatusChange, onPayments, onComplete, onPrintDocument,
}: {
  selectedIds: string[]
  printingKey: string | null
  onToggleAll: (checked: boolean) => void
  onToggleOne: (id: string, checked: boolean) => void
  onEdit: (r: AdminReservation) => void
  onDelete: (r: AdminReservation) => void
  onStatusChange: (id: ReservationId, status: ReservationStatus) => void
  onPayments: (r: AdminReservation) => void
  onComplete: (r: AdminReservation) => void
  onPrintDocument: (r: AdminReservation, type: DocumentType) => void
}): ColumnDef<AdminReservation>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const rows = table.options.data
        const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(String(r.id)))
        const someSelected = rows.some((r) => selectedIds.includes(String(r.id)))
        return <Checkbox checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={(c) => onToggleAll(c === true)} />
      },
      cell: ({ row }) => <Checkbox checked={selectedIds.includes(String(row.original.id))} onCheckedChange={(c) => onToggleOne(String(row.original.id), c === true)} />,
      enableSorting: false, enableHiding: false,
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium tracking-tight">{r.client?.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{r.client?.phone}</p>
          </div>
        )
      },
    },
    {
      id: "vehicle",
      header: "Vehicule",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">{r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : "—"}</p>
            <p className="font-mono text-xs text-muted-foreground">{r.vehicle?.registration_number}</p>
          </div>
        )
      },
    },
    {
      id: "period",
      header: "Periode",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="space-y-0.5 text-sm">
            <p>{formatDate(r.start_date)} → {formatDate(r.end_date)}</p>
            <p className="text-xs text-muted-foreground">{r.total_days} jour{r.total_days > 1 ? "s" : ""}</p>
          </div>
        )
      },
    },
    {
      id: "mileage",
      header: "Kilometrage",
      cell: ({ row }) => {
        const r = row.original
        if (r.start_mileage_km === null && r.return_mileage_km === null) {
          return <span className="text-xs text-muted-foreground">Non cloturee</span>
        }

        return (
          <div className="space-y-0.5 text-xs">
            <p className="tabular-nums">{formatKm(r.start_mileage_km)} â†’ {formatKm(r.return_mileage_km)}</p>
            <p className="font-medium tabular-nums">{formatKm(r.driven_mileage_km)} parcourus</p>
          </div>
        )
      },
    },
    {
      id: "amount",
      header: "Montant",
      cell: ({ row }) => {
        const r = row.original
        const summary = r.payments_summary
        const remaining = summary?.remaining ?? Number(r.total_amount)
        return (
          <div className="space-y-1">
            <p className="font-semibold">{formatAmount(r.total_amount)}</p>
            {r.vehicle?.is_subcontracted ? (
              <div className="space-y-0.5 rounded-md bg-sky-500/10 px-2 py-1 text-[10px] text-sky-700 dark:text-sky-300">
                <p>Prix client/jour : {formatAmount(r.price_per_day)}</p>
                <p>Cout reel/jour : {formatAmount(r.subcontract_daily_cost)}</p>
                <p className="font-semibold">Benefice : {formatAmount(r.estimated_profit)}</p>
              </div>
            ) : null}
            {summary && summary.count > 0 && (
              <div className="w-20 h-1 rounded-full bg-border/50 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", remaining <= 0 ? "bg-emerald-500" : "bg-amber-500")}
                  style={{ width: `${Math.min(100, (summary.net_paid / Number(r.total_amount)) * 100)}%` }}
                />
              </div>
            )}
            {remaining > 0 && <p className="text-[10px] text-amber-600">Reste : {formatAmount(remaining)}</p>}
          </div>
        )
      },
    },
    {
      id: "payment",
      header: "Paiement",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", PAYMENT_STATUS_STYLES[row.original.payment_status])}>
          {PAYMENT_STATUS_LABELS[row.original.payment_status]}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: ({ row }) => {
        const r = row.original
        return (
          <Select value={r.reservation_status} onValueChange={(v: ReservationStatus) => onStatusChange(r.id, v)}>
            <SelectTrigger className="h-auto border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0">
              <Badge variant="outline" className={cn("cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-semibold", RESERVATION_STATUS_STYLES[r.reservation_status])}>
                {RESERVATION_STATUS_LABELS[r.reservation_status]}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RESERVATION_STATUS_LABELS) as ReservationStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{RESERVATION_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const r = row.original
        const canClose = r.reservation_status === "active" || r.reservation_status === "confirmed"
        const contractKey = `${r.id}:contract`
        const invoiceKey = `${r.id}:invoice`
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
              onClick={() => onPrintDocument(r, "contract")}
              title="Imprimer le contrat favori"
              disabled={printingKey === contractKey}
            >
              {printingKey === contractKey ? <Loader2 className="size-3.5 animate-spin" /> : <FileSignature className="size-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/30"
              onClick={() => onPrintDocument(r, "invoice")}
              title="Imprimer la facture de paiement favorite"
              disabled={printingKey === invoiceKey}
            >
              {printingKey === invoiceKey ? <Loader2 className="size-3.5 animate-spin" /> : <Printer className="size-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-primary hover:bg-primary/10"
              onClick={() => onPayments(r)}
              title="Gerer les paiements"
            >
              <Receipt className="size-3.5" />
            </Button>
            <PermissionGate permission={PERM_RESERVATIONS_EDIT}>
              {canClose ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                  onClick={() => onComplete(r)}
                  title="Cloturer la reservation"
                >
                  <CheckCheck className="size-3.5" />
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(r)}>
                <Pencil className="size-3.5" />
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERM_RESERVATIONS_DELETE}>
              <Button variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30" onClick={() => onDelete(r)}>
                <Trash2 className="size-3.5" />
              </Button>
            </PermissionGate>
          </div>
        )
      },
    },
  ]
}

// ─── CalendarView ─────────────────────────────────────────────────────────────

function CalendarView({ reservations, vehicles, onPayments, onEdit }: {
  reservations: AdminReservation[]
  vehicles: AdminVehicle[]
  onPayments: (r: AdminReservation) => void
  onEdit: (r: AdminReservation) => void
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<ReservationStatus>>(new Set())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const adjustedFirstDay = (firstDayOfMonth + 6) % 7

  const MONTHS = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"]
  const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  const toggleStatus = (status: ReservationStatus) => setHiddenStatuses((cur) => {
    const next = new Set(cur)
    if (next.has(status)) next.delete(status); else next.add(status)
    return next
  })

  const vehicleOptions = useMemo(() => vehicles.map(vehicleOption), [vehicles])

  const filteredReservations = useMemo(
    () => reservations.filter((r) => {
      if (vehicleFilter && String(r.vehicle_id) !== vehicleFilter) return false
      if (hiddenStatuses.has(r.reservation_status)) return false
      return true
    }),
    [reservations, vehicleFilter, hiddenStatuses],
  )

  const reservationsForDay = (day: number) => {
    const date = new Date(year, month, day); date.setHours(0, 0, 0, 0)
    return filteredReservations.filter((r) => {
      const start = new Date(r.start_date); const end = new Date(r.end_date)
      start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0)
      return date >= start && date <= end
    })
  }

  const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(RESERVATION_STATUS_LABELS) as ReservationStatus[]).map((s) => {
            const hidden = hiddenStatuses.has(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors",
                  hidden ? "border-border/50 text-muted-foreground/50 line-through" : "border-border/70 hover:bg-muted",
                )}
                title={hidden ? "Afficher" : "Masquer"}
              >
                <span className={cn("size-2.5 rounded-full", CALENDAR_STATUS_COLORS[s], hidden && "opacity-30")} />
                {RESERVATION_STATUS_LABELS[s]}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 sm:w-72">
          <SearchableSelect
            value={vehicleFilter}
            options={vehicleOptions}
            onValueChange={setVehicleFilter}
            placeholder="Filtrer par vehicule"
            searchPlaceholder="Rechercher matricule, marque, modele..."
            emptyMessage="Aucun vehicule trouve."
            className="flex-1"
          />
          {vehicleFilter ? (
            <Button variant="ghost" size="icon" onClick={() => setVehicleFilter("")} title="Reinitialiser">
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="size-4" /></Button>
        <h2 className="text-base font-semibold">{MONTHS[month]} {year}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="size-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-px">
        {DAYS.map((d) => <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/30">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNumber = i - adjustedFirstDay + 1
          const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth
          const isToday = isCurrentMonth && dayNumber === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dayReservations = isCurrentMonth ? reservationsForDay(dayNumber) : []
          return (
            <div key={i} className={cn("min-h-[90px] bg-background p-1.5 text-xs", !isCurrentMonth && "bg-muted/20 opacity-40")}>
              {isCurrentMonth && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <div className={cn("flex size-6 items-center justify-center rounded-full font-medium", isToday && "bg-primary text-primary-foreground")}>{dayNumber}</div>
                    {dayReservations.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">{dayReservations.length}</span>
                    )}
                  </div>
                  <div className="max-h-[140px] space-y-0.5 overflow-y-auto pr-0.5">
                    {dayReservations.map((r) => (
                      <div key={r.id} className="flex gap-0.5">
                        <button
                          className={cn("min-w-0 flex-1 truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-white transition-opacity hover:opacity-80", CALENDAR_STATUS_COLORS[r.reservation_status])}
                          onClick={() => onEdit(r)}
                          title={`${r.vehicle?.brand} ${r.vehicle?.model} (${r.vehicle?.registration_number}) — ${r.client?.full_name} — ${RESERVATION_STATUS_LABELS[r.reservation_status]}`}
                        >
                          {r.vehicle
                            ? `${r.vehicle.brand} ${r.vehicle.model} · ${r.vehicle.registration_number}`
                            : r.client?.full_name}
                        </button>
                        <button
                          className="shrink-0 rounded bg-muted/80 px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-primary/20 hover:text-primary"
                          onClick={() => onPayments(r)}
                          title="Paiements"
                        >
                          <Receipt className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ reservations }: { reservations: AdminReservation[] }) {
  const stats = useMemo(() => {
    const total = reservations.length
    const active = reservations.filter((r) => r.reservation_status === "active").length
    const pending = reservations.filter((r) => r.reservation_status === "pending").length
    const revenue = reservations.filter((r) => r.reservation_status !== "cancelled").reduce((s, r) => s + Number(r.total_amount), 0)
    return { total, active, pending, revenue }
  }, [reservations])

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        { label: "Total", value: stats.total, icon: CalendarDays, color: "text-primary" },
        { label: "En cours", value: stats.active, icon: Clock, color: "text-emerald-600" },
        { label: "En attente", value: stats.pending, icon: Clock, color: "text-amber-600" },
        { label: "Chiffre d'affaires", value: formatAmount(stats.revenue), icon: CircleDollarSign, color: "text-violet-600" },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="border-border/70">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn("rounded-lg bg-muted p-2", color)}><Icon className="size-4" /></div>
            <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── CompleteReservationDialog ────────────────────────────────────────────────

function CompleteReservationDialog({
  reservation, currentMileage, isSaving, onOpenChange, onConfirm,
}: {
  reservation: AdminReservation | null
  currentMileage: number
  isSaving: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (km: number, notes: string) => Promise<void>
}) {
  const [km, setKm] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (reservation) {
      setKm(currentMileage > 0 ? String(currentMileage) : "")
      setNotes("")
    }
  }, [reservation, currentMileage])

  const open = Boolean(reservation)
  const kmNumber = Number(km)
  const isInvalid = !km || Number.isNaN(kmNumber) || kmNumber < 0 || (currentMileage > 0 && kmNumber < currentMileage)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cloturer la reservation</DialogTitle>
          <DialogDescription>
            {reservation?.vehicle
              ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.registration_number})`
              : "Saisir le kilometrage de retour."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-2">
              <Gauge className="size-3.5 text-muted-foreground" />
              Nouveau kilometrage (km) *
            </label>
            <Input
              type="number"
              min={currentMileage > 0 ? currentMileage : 0}
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="ex: 56000"
            />
            {currentMileage > 0 ? (
              <p className="text-xs text-muted-foreground">
                Kilometrage actuel du vehicule : {currentMileage.toLocaleString("fr-FR")} km
              </p>
            ) : null}
            {km && currentMileage > 0 && kmNumber < currentMileage ? (
              <p className="text-xs text-rose-600">
                Le kilometrage de retour doit etre superieur ou egal au kilometrage actuel.
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes (optionnel)</label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Etat du vehicule, observations..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
          <Button
            onClick={() => onConfirm(kmNumber, notes)}
            disabled={isSaving || isInvalid}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
            Cloturer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function ReservationsPage() {
  const [view, setView] = useState<ViewMode>("table")
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | "all">("all")
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | "all">("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [editingReservation, setEditingReservation] = useState<AdminReservation | null>(null)
  const [deletingReservation, setDeletingReservation] = useState<AdminReservation | null>(null)
  const [completingReservation, setCompletingReservation] = useState<AdminReservation | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [paymentsReservation, setPaymentsReservation] = useState<AdminReservation | null>(null)
  const [printingKey, setPrintingKey] = useState<string | null>(null)

  const queryParams = useMemo(() => ({
    search: deferredSearch.trim() || undefined,
    reservation_status: filterStatus === "all" ? undefined : filterStatus,
    payment_status: filterPayment === "all" ? undefined : filterPayment,
  }), [deferredSearch, filterStatus, filterPayment])

  const { data: reservations = EMPTY_RESERVATIONS, isLoading, isFetching, error, refetch } = useGetReservationsQuery(queryParams)
  const { data: pageVehicles = [] } = useGetVehiclesQuery()
  const { data: documentTemplates = [] } = useGetTemplatesQuery()
  const [createReservation, { isLoading: isCreating }] = useCreateReservationMutation()
  const [updateReservation, { isLoading: isUpdating }] = useUpdateReservationMutation()
  const [deleteReservation, { isLoading: isDeleting }] = useDeleteReservationMutation()
  const [bulkDeleteReservations, { isLoading: isBulkDeleting }] = useBulkDeleteReservationsMutation()
  const [updateStatus] = useUpdateReservationStatusMutation()
  const [completeReservation, { isLoading: isCompleting }] = useCompleteReservationMutation()
  const [generateDocument] = useGenerateDocumentMutation()
  const defaultTemplateByType = useMemo(() => {
    const findTemplate = (type: DocumentType) =>
      documentTemplates.find((template) => template.type === type && template.is_default) ??
      documentTemplates.find((template) => template.type === type)

    return {
      contract: findTemplate("contract"),
      invoice: findTemplate("invoice"),
    }
  }, [documentTemplates])

  useEffect(() => { if (error) toast.error(getErrorMessage(error, "Impossible de charger les reservations.")) }, [error])
  const displayReservations = useMemo(
    () => [...reservations].sort((a, b) => {
      const createdDiff = reservationCreatedTime(b) - reservationCreatedTime(a)
      if (createdDiff !== 0) return createdDiff
      return Number(b.id) - Number(a.id)
    }),
    [reservations]
  )

  useEffect(() => { setSelectedIds((cur) => cur.filter((id) => displayReservations.some((r) => String(r.id) === id))) }, [displayReservations])

  // Sync le panneau paiements si la réservation est mise à jour
  useEffect(() => {
    if (!paymentsReservation) return
    const updated = displayReservations.find((r) => r.id === paymentsReservation.id)
    if (updated) setPaymentsReservation(updated)
  }, [displayReservations])

  const toggleAll = (checked: boolean) => setSelectedIds(checked ? displayReservations.map((r) => String(r.id)) : [])
  const toggleOne = (id: string, checked: boolean) => setSelectedIds((cur) => checked ? Array.from(new Set([...cur, id])) : cur.filter((v) => v !== id))

  const handleCreate = () => { setDialogMode("create"); setEditingReservation(null); setDialogOpen(true) }

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    if (searchParams?.get("new") === "1") {
      setDialogMode("create")
      setEditingReservation(null)
      setDialogOpen(true)
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, pathname, router])

  const handleEdit = (r: AdminReservation) => { setDialogMode("edit"); setEditingReservation(r); setDialogOpen(true) }
  const handlePayments = (r: AdminReservation) => setPaymentsReservation(r)

  const handlePrintDocument = async (reservation: AdminReservation, type: DocumentType) => {
    const template = defaultTemplateByType[type]
    if (!template) {
      toast.error(type === "contract"
        ? "Aucun modele contrat trouve. Creez ou favorisez un contrat dans Documents."
        : "Aucun modele facture trouve. Creez ou favorisez une facture dans Documents."
      )
      return
    }

    const key = `${reservation.id}:${type}`
    try {
      setPrintingKey(key)
      const result = await generateDocument({
        templateId: template.id as TemplateId,
        reservation_id: Number(reservation.id),
      }).unwrap()
      printHtml(result.html)
      toast.success(type === "contract" ? "Contrat pret pour impression." : "Facture prete pour impression.")
    } catch (e) {
      toast.error(getErrorMessage(e, type === "contract" ? "Impossible d'imprimer le contrat." : "Impossible d'imprimer la facture."))
    } finally {
      setPrintingKey(null)
    }
  }

  const handleSubmit = async (payload: ReservationFormRequest) => {
    try {
      if (dialogMode === "create") {
        await createReservation(payload).unwrap()
        toast.success("Reservation creee avec succes.")
      } else if (editingReservation) {
        await updateReservation({ reservationId: editingReservation.id, ...payload }).unwrap()
        toast.success("Reservation modifiee avec succes.")
      }
      setDialogOpen(false); setEditingReservation(null)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible d'enregistrer la reservation."))
    }
  }

  const handleDelete = async () => {
    if (!deletingReservation) return
    try {
      await deleteReservation(deletingReservation.id).unwrap()
      toast.success("Reservation supprimee."); setDeletingReservation(null)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible de supprimer la reservation."))
    }
  }

  const handleComplete = async (km: number, notes: string) => {
    if (!completingReservation) return
    try {
      await completeReservation({
        reservationId: completingReservation.id,
        return_mileage_km: km,
        return_notes: notes.trim() || undefined,
      }).unwrap()
      toast.success("Reservation cloturee.")
      setCompletingReservation(null)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible de cloturer la reservation."))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteReservations({ reservation_ids: selectedIds }).unwrap()
      toast.success(`${selectedIds.length} reservation(s) supprimee(s).`)
      setSelectedIds([]); setBulkDeleteOpen(false)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible de supprimer les reservations."))
    }
  }

  const handleStatusChange = async (id: ReservationId, status: ReservationStatus) => {
    try {
      await updateStatus({ reservationId: id, reservation_status: status }).unwrap()
      toast.success("Statut mis a jour.")
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible de mettre a jour le statut."))
    }
  }

  const columns = useMemo(() => getColumns({
    selectedIds,
    printingKey,
    onToggleAll: toggleAll,
    onToggleOne: toggleOne,
    onEdit: handleEdit,
    onDelete: setDeletingReservation,
    onStatusChange: handleStatusChange,
    onPayments: handlePayments,
    onComplete: setCompletingReservation,
    onPrintDocument: handlePrintDocument,
  }), [displayReservations, selectedIds, printingKey, defaultTemplateByType])

  const selectedCount = selectedIds.length

  return (
    <ListPageShell
      badge="Location"
      title="Reservations"
      description="Gestion des reservations et locations de vehicules."
      action={
        <PermissionGate permission={PERM_RESERVATIONS_CREATE}>
          <Button className="w-full md:w-auto" onClick={handleCreate}>
            <Plus className="size-4" />Nouvelle reservation
          </Button>
        </PermissionGate>
      }
    >
      <StatsBar reservations={displayReservations} />

      <Card className="brand-panel border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-primary" />
                Liste des reservations
              </CardTitle>
              <CardDescription>{displayReservations.length} reservation(s) au total.</CardDescription>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="table" className="gap-1.5"><Table2 className="size-3.5" />Tableau</TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="size-3.5" />Calendrier</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === "table" && (
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative min-w-[240px]">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher client, vehicule..." className="pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ReservationStatus | "all")}>
                <SelectTrigger className="w-full lg:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {(Object.keys(RESERVATION_STATUS_LABELS) as ReservationStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{RESERVATION_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPayment} onValueChange={(v) => setFilterPayment(v as PaymentStatus | "all")}>
                <SelectTrigger className="w-full lg:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout paiement</SelectItem>
                  {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3 p-4">
          {view === "table" ? (
            <>
              {selectedCount > 0 && (
                <PermissionGate permission={PERM_RESERVATIONS_DELETE}>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                    <Badge variant="outline" className="rounded-full">{selectedCount} selectionne(s)</Badge>
                    <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                      <Trash2 className="size-3.5" />Supprimer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                      <X className="size-3.5" />Deselectionner
                    </Button>
                  </div>
                </PermissionGate>
              )}
              {isLoading ? (
                <div className="flex h-52 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <DataTable columns={columns} data={displayReservations} emptyMessage="Aucune reservation ne correspond aux filtres." />
              )}
            </>
          ) : (
            isLoading
              ? <div className="flex h-52 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
              : <CalendarView reservations={displayReservations} vehicles={pageVehicles} onEdit={handleEdit} onPayments={handlePayments} />
          )}
        </CardContent>
      </Card>

      <ReservationWizardDialog
        open={dialogOpen}
        mode={dialogMode}
        reservation={editingReservation}
        isSaving={isCreating || isUpdating}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <PaymentsPanel
        open={Boolean(paymentsReservation)}
        reservation={paymentsReservation}
        onOpenChange={(open) => { if (!open) setPaymentsReservation(null) }}
      />

      <CompleteReservationDialog
        reservation={completingReservation}
        currentMileage={
          completingReservation
            ? Number(
                pageVehicles.find((v) => String(v.id) === String(completingReservation.vehicle_id))?.current_mileage ?? 0
              )
            : 0
        }
        isSaving={isCompleting}
        onOpenChange={(open) => { if (!open) setCompletingReservation(null) }}
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={Boolean(deletingReservation)}
        title="Supprimer la reservation"
        description={deletingReservation ? `Confirmer la suppression de la reservation de ${deletingReservation.client?.full_name ?? "ce client"} ?` : ""}
        confirmLabel="Supprimer"
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => { if (!open) setDeletingReservation(null) }}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Supprimer ${selectedCount} reservation(s)`}
        description="Cette action supprimera definitivement les reservations selectionnees."
        confirmLabel="Supprimer"
        destructive
        isLoading={isBulkDeleting}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
      />
    </ListPageShell>
  )
}
