"use client"

import React, { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  RefreshCcw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/admin/data-table"
import { ListPageShell } from "@/components/admin/list-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type {
  CreatePaymentRequest,
  PaymentMethod,
  PaymentType,
  PaymentWithReservation,
  UpdatePaymentRequest,
} from "@/store/api/payments"
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
  useUpdatePaymentMutation,
} from "@/store/api/payments"
import { useGetReservationsQuery } from "@/store/api/reservations"
import type { AdminReservation, ReservationStatus } from "@/store/api/reservations"
import { useUpdateReservationStatusMutation } from "@/store/api/reservations"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error && typeof error === "object") {
    const c = error as { data?: { message?: unknown }; error?: string }
    if (typeof c.data?.message === "string") return c.data.message
    if (typeof c.error === "string") return c.error
  }
  return fallback
}

function formatDate(v?: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(v))
}

function formatAmount(v?: number | string | null) {
  if (v === undefined || v === null) return "—"
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
  }).format(Number(v))
}

function reservationOption(reservation: AdminReservation): SearchableSelectOption {
  const client = reservation.client?.full_name ?? "Client"
  const vehicle = reservation.vehicle
    ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.registration_number})`
    : "Vehicule"

  return {
    value: String(reservation.id),
    label: `${client} - ${vehicle}`,
    description: `${formatDate(reservation.start_date)} -> ${formatDate(reservation.end_date)} - ${formatAmount(reservation.total_amount)}`,
    searchText: [
      client,
      reservation.client?.phone,
      reservation.client?.cin,
      reservation.vehicle?.brand,
      reservation.vehicle?.model,
      reservation.vehicle?.registration_number,
    ].filter(Boolean).join(" "),
  }
}

// ─── Labels / styles ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PaymentType, string> = {
  deposit: "Acompte",
  partial: "Partiel",
  full: "Complet",
  refund: "Remboursement",
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Especes",
  card: "Carte",
  transfer: "Virement",
  check: "Cheque",
}

const TYPE_STYLES: Record<PaymentType, string> = {
  deposit: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  partial: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  full: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  refund: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  active: "En cours",
  completed: "Terminee",
  cancelled: "Annulee",
}

const RESERVATION_STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  confirmed: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  completed: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Wallet,
  check: Receipt,
}

const EMPTY: PaymentWithReservation[] = []

// ─── Payment Form Dialog (add + edit) ────────────────────────────────────────

type PaymentFormState = {
  reservation_id: string
  amount: string
  type: PaymentType
  method: PaymentMethod
  paid_at: string
  reference: string
  notes: string
}

const emptyForm: PaymentFormState = {
  reservation_id: "",
  amount: "",
  type: "full",
  method: "cash",
  paid_at: new Date().toISOString().slice(0, 10),
  reference: "",
  notes: "",
}

function paymentToForm(p: PaymentWithReservation): PaymentFormState {
  return {
    reservation_id: String(p.reservation_id),
    amount: String(p.amount),
    type: p.type,
    method: p.method,
    paid_at: p.paid_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    reference: p.reference ?? "",
    notes: p.notes ?? "",
  }
}

function PaymentFormDialog({
  open,
  editingPayment,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editingPayment: PaymentWithReservation | null
  isSaving: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (reservationId: string, payload: CreatePaymentRequest | UpdatePaymentRequest, paymentId?: number | string) => Promise<void>
}) {
  const isEdit = editingPayment !== null
  const [form, setForm] = useState<PaymentFormState>(emptyForm)
  const [reservationSearch, setReservationSearch] = useState("")

  const { data: reservations = [] } = useGetReservationsQuery(
    { search: reservationSearch.trim() || undefined },
    { skip: isEdit }
  )

  useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setReservationSearch("")
      return
    }
    if (editingPayment) {
      setForm(paymentToForm(editingPayment))
    }
  }, [open, editingPayment])

  const set = (patch: Partial<PaymentFormState>) => setForm((f) => ({ ...f, ...patch }))

  const selectedReservation = !isEdit
    ? reservations.find((r) => String(r.id) === form.reservation_id)
    : null
  const reservationOptions = useMemo(() => reservations.map(reservationOption), [reservations])

  useEffect(() => {
    if (!isEdit && form.type === "full" && selectedReservation?.payments_summary) {
      const remaining = selectedReservation.payments_summary.remaining
      if (remaining > 0) set({ amount: String(remaining) })
    }
  }, [form.type, form.reservation_id, isEdit])

  const isInvalid =
    (!isEdit && !form.reservation_id) ||
    !form.amount ||
    Number(form.amount) <= 0 ||
    !form.paid_at

  const handleSubmit = async () => {
    const payload: CreatePaymentRequest = {
      amount: Number(form.amount),
      type: form.type,
      method: form.method,
      paid_at: form.paid_at,
      reference: form.reference.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }
    await onSubmit(form.reservation_id, payload, editingPayment?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-140">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="size-4 text-primary" /> : <Plus className="size-4 text-primary" />}
            {isEdit ? "Modifier le paiement" : "Nouveau paiement"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les details du paiement."
              : "Enregistrez un paiement sur une reservation existante."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-5 px-6 py-5">

            {/* Réservation — uniquement en création */}
            {!isEdit && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reservation *</label>
                  <SearchableSelect
                    value={form.reservation_id}
                    options={reservationOptions}
                    onValueChange={(v) => set({ reservation_id: v, amount: "" })}
                    placeholder="Selectionner une reservation..."
                    searchPlaceholder="Rechercher client, vehicule, matricule..."
                    emptyMessage="Aucune reservation trouvee."
                    renderOption={(option) => (
                      <div className="min-w-0">
                        <p className="truncate font-medium">{option.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    )}
                  />
                  <Input
                    placeholder="Rechercher par client ou vehicule..."
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                    className="hidden"
                  />
                  <Select value={form.reservation_id} onValueChange={(v) => set({ reservation_id: v, amount: "" })}>
                    <SelectTrigger className="hidden">
                      <SelectValue placeholder="Selectionner une reservation..." />
                    </SelectTrigger>
                    <SelectContent>
                      {reservations.map((r) => (
                        <SelectItem key={String(r.id)} value={String(r.id)}>
                          <span className="flex flex-col">
                            <span>{r.client?.full_name ?? "—"} — {r.vehicle?.brand} {r.vehicle?.model}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(r.start_date)} → {formatDate(r.end_date)} · {formatAmount(r.total_amount)}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedReservation?.payments_summary && (
                    <div className="flex flex-wrap gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">
                        Total : <span className="font-medium text-foreground">{formatAmount(selectedReservation.total_amount)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Encaisse : <span className="font-medium text-emerald-600">{formatAmount(selectedReservation.payments_summary.net_paid)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Restant : <span className={cn("font-medium", selectedReservation.payments_summary.remaining > 0 ? "text-amber-600" : "text-emerald-600")}>
                          {formatAmount(selectedReservation.payments_summary.remaining)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                <Separator className="opacity-50" />
              </>
            )}

            {/* En édition : rappel de la réservation */}
            {isEdit && editingPayment?.reservation && (
              <>
                <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs space-y-1">
                  <p className="font-medium text-foreground">
                    {editingPayment.reservation.client?.full_name ?? "—"} — {editingPayment.reservation.vehicle?.brand} {editingPayment.reservation.vehicle?.model}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(editingPayment.reservation.start_date)} → {formatDate(editingPayment.reservation.end_date)} · Total : {formatAmount(editingPayment.reservation.total_amount)}
                  </p>
                </div>
                <Separator className="opacity-50" />
              </>
            )}

            {/* Type & méthode */}
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Type *</label>
                <Select value={form.type} onValueChange={(v: PaymentType) => set({ type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as PaymentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          {t === "refund"
                            ? <ArrowDownLeft className="size-3.5 text-rose-500" />
                            : <ArrowUpRight className="size-3.5 text-emerald-500" />}
                          {TYPE_LABELS[t]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Methode *</label>
                <Select value={form.method} onValueChange={(v: PaymentMethod) => set({ method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash"><span className="flex items-center gap-2"><Banknote className="size-3.5" />Especes</span></SelectItem>
                    <SelectItem value="card"><span className="flex items-center gap-2"><CreditCard className="size-3.5" />Carte</span></SelectItem>
                    <SelectItem value="transfer"><span className="flex items-center gap-2"><Wallet className="size-3.5" />Virement</span></SelectItem>
                    <SelectItem value="check"><span className="flex items-center gap-2"><Receipt className="size-3.5" />Cheque</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Montant & date */}
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Montant (MAD) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set({ amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={form.paid_at}
                  onChange={(e) => set({ paid_at: e.target.value })}
                />
              </div>
            </div>

            {/* Référence */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reference</label>
              <Input
                value={form.reference}
                onChange={(e) => set({ reference: e.target.value })}
                placeholder="N° recu, reference virement..."
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
                placeholder="Remarque optionnelle..."
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isInvalid}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, description, isLoading, onOpenChange, onConfirm,
}: {
  open: boolean; title: string; description: string; isLoading: boolean
  onOpenChange: (v: boolean) => void; onConfirm: () => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Colonnes ─────────────────────────────────────────────────────────────────

function getColumns({
  onEdit,
  onDelete,
  onStatusChange,
}: {
  onEdit: (p: PaymentWithReservation) => void
  onDelete: (p: PaymentWithReservation) => void
  onStatusChange: (p: PaymentWithReservation, status: ReservationStatus) => void
}): ColumnDef<PaymentWithReservation>[] {
  return [
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-medium">{formatDate(row.original.paid_at)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(row.original.created_at)}</p>
        </div>
      ),
    },
    {
      id: "client",
      header: "Client / Vehicule",
      cell: ({ row }) => {
        const r = row.original.reservation
        return (
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">{r?.client?.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {r?.vehicle
                ? `${r.vehicle.brand} ${r.vehicle.model} · ${r.vehicle.registration_number}`
                : "—"}
            </p>
          </div>
        )
      },
    },
    {
      id: "reservation",
      header: "Reservation",
      cell: ({ row }) => {
        const r = row.original.reservation
        if (!r) return <span className="text-muted-foreground">—</span>
        return (
          <div className="space-y-0.5 text-sm">
            <p>{formatDate(r.start_date)} → {formatDate(r.end_date)}</p>
            <p className="text-xs text-muted-foreground">{formatAmount(r.total_amount)} total</p>
          </div>
        )
      },
    },
    {
      id: "res_status",
      header: "Statut reservation",
      cell: ({ row }) => {
        const r = row.original.reservation
        if (!r) return <span className="text-muted-foreground">—</span>
        const status = r.reservation_status as ReservationStatus
        return (
          <Select
            value={status}
            onValueChange={(v: ReservationStatus) => onStatusChange(row.original, v)}
          >
            <SelectTrigger className="h-auto border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0">
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  RESERVATION_STATUS_STYLES[status] ?? ""
                )}
              >
                {RESERVATION_STATUS_LABELS[status] ?? status}
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
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.type === "refund"
            ? <ArrowDownLeft className="size-3.5 text-rose-500" />
            : <ArrowUpRight className="size-3.5 text-emerald-500" />}
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              TYPE_STYLES[row.original.type]
            )}
          >
            {TYPE_LABELS[row.original.type]}
          </Badge>
        </div>
      ),
    },
    {
      id: "method",
      header: "Methode",
      cell: ({ row }) => {
        const Icon = METHOD_ICONS[row.original.method]
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Icon className="size-3.5 text-muted-foreground" />
            {METHOD_LABELS[row.original.method]}
          </div>
        )
      },
    },
    {
      id: "amount",
      header: "Montant",
      cell: ({ row }) => (
        <span
          className={cn(
            "font-semibold tabular-nums",
            row.original.type === "refund"
              ? "text-rose-600"
              : "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {row.original.type === "refund" ? "−" : "+"}{formatAmount(row.original.amount)}
        </span>
      ),
    },
    {
      id: "ref",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.reference ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 hover:bg-muted"
            onClick={() => onEdit(row.original)}
            title="Modifier"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
            onClick={() => onDelete(row.original)}
            title="Supprimer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [filterType, setFilterType] = useState<PaymentType | "all">("all")
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "all">("all")
  const [deletingPayment, setDeletingPayment] = useState<PaymentWithReservation | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentWithReservation | null>(null)

  const queryParams = useMemo(() => ({
    search: deferredSearch.trim() || undefined,
    type: filterType === "all" ? undefined : filterType,
    method: filterMethod === "all" ? undefined : filterMethod,
  }), [deferredSearch, filterType, filterMethod])

  const { data, isLoading, isFetching, error, refetch } = useGetAllPaymentsQuery(queryParams)
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation()
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentMutation()
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentMutation()
  const [updateReservationStatus] = useUpdateReservationStatusMutation()

  const payments = data?.payments ?? EMPTY
  const summary = data?.global_summary

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error, "Impossible de charger les paiements."))
  }, [error])

  const openAdd = () => {
    setEditingPayment(null)
    setFormOpen(true)
  }

  const openEdit = (p: PaymentWithReservation) => {
    setEditingPayment(p)
    setFormOpen(true)
  }

  const handleFormSubmit = async (
    reservationId: string,
    payload: CreatePaymentRequest | UpdatePaymentRequest,
    paymentId?: number | string
  ) => {
    try {
      if (paymentId !== undefined) {
        await updatePayment({ reservationId, paymentId, ...payload }).unwrap()
        toast.success("Paiement mis a jour.")
      } else {
        await createPayment({ reservationId, ...(payload as CreatePaymentRequest) }).unwrap()
        toast.success("Paiement enregistre.")
      }
      setFormOpen(false)
      setEditingPayment(null)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible d'enregistrer le paiement."))
    }
  }

  const handleDelete = async () => {
    if (!deletingPayment) return
    try {
      await deletePayment({
        reservationId: deletingPayment.reservation_id,
        paymentId: deletingPayment.id,
      }).unwrap()
      toast.success("Paiement supprime.")
      setDeletingPayment(null)
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible de supprimer le paiement."))
    }
  }

  const handleStatusChange = async (p: PaymentWithReservation, status: ReservationStatus) => {
    if (!p.reservation?.id) return
    try {
      await updateReservationStatus({
        reservationId: p.reservation.id,
        reservation_status: status,
      }).unwrap()
      toast.success("Statut mis a jour.")
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossible de mettre a jour le statut."))
    }
  }

  const columns = useMemo(
    () => getColumns({ onEdit: openEdit, onDelete: setDeletingPayment, onStatusChange: handleStatusChange }),
    []
  )

  return (
    <ListPageShell
      badge="Location"
      title="Paiements"
      description="Historique de tous les paiements enregistres."
      action={
        <Button className="w-full md:w-auto" onClick={openAdd}>
          <Plus className="size-4" />
          Nouveau paiement
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total transactions", value: summary?.count ?? 0, icon: Receipt, color: "text-primary" },
          { label: "Encaisse", value: formatAmount(summary?.total_in ?? 0), icon: TrendingUp, color: "text-emerald-600" },
          { label: "Rembourse", value: formatAmount(summary?.total_out ?? 0), icon: TrendingDown, color: "text-rose-600" },
          { label: "Net", value: formatAmount(summary?.net ?? 0), icon: CircleDollarSign, color: "text-violet-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/70">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("rounded-lg bg-muted p-2", color)}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="brand-panel border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4 text-primary" />
              Historique des paiements
            </CardTitle>
            <CardDescription>{payments.length} paiement(s) au total.</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-60">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher client, vehicule..."
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as PaymentType | "all")}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {(Object.keys(TYPE_LABELS) as PaymentType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={(v) => setFilterMethod(v as PaymentMethod | "all")}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes methodes</SelectItem>
                {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payments}
              emptyMessage="Aucun paiement ne correspond aux filtres."
            />
          )}
        </CardContent>
      </Card>

      <PaymentFormDialog
        open={formOpen}
        editingPayment={editingPayment}
        isSaving={isCreating || isUpdating}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditingPayment(null) }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingPayment)}
        title="Supprimer le paiement"
        description={
          deletingPayment
            ? `Supprimer le paiement de ${formatAmount(deletingPayment.amount)} (${TYPE_LABELS[deletingPayment.type]}) du ${formatDate(deletingPayment.paid_at)} ?`
            : ""
        }
        isLoading={isDeleting}
        onOpenChange={(open) => { if (!open) setDeletingPayment(null) }}
        onConfirm={handleDelete}
      />
    </ListPageShell>
  )
}
