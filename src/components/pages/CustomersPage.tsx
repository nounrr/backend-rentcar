"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  BadgeCheck,
  CircleCheck,
  CircleOff,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  PERM_CUSTOMERS_CREATE,
  PERM_CUSTOMERS_EDIT,
} from "@/lib/permissions"
import type { AdminCustomer, CustomerFormRequest } from "@/store/api/customers"
import {
  useBulkDeleteCustomersMutation,
  useBulkUpdateCustomerStatusMutation,
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
  useUpdateCustomerMutation,
} from "@/store/api/customers"

type StatusFilter = "all" | "active" | "inactive"
type DialogMode = "create" | "edit"

const EMPTY_CUSTOMERS: AdminCustomer[] = []

type CustomerFormState = {
  full_name: string
  phone: string
  email: string
  address: string
  city: string
  nationality: string
  cin: string
  passport: string
  driving_license_number: string
  driving_license_issued_at: string
  driving_license_expires_at: string
  driving_license_scan: File | null
  identity_document_scan: File | null
  password: string
  is_active: boolean
  remove_driving_license_scan: boolean
  remove_identity_document_scan: boolean
}

const emptyForm: CustomerFormState = {
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
  identity_document_scan: null,
  password: "password",
  is_active: true,
  remove_driving_license_scan: false,
  remove_identity_document_scan: false,
}

function getErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error && typeof error === "object") {
    const candidate = error as { data?: { message?: unknown }; error?: string }
    if (typeof candidate.data?.message === "string") return candidate.data.message
    if (typeof candidate.error === "string") return candidate.error
  }

  return fallback
}

function formatDate(value?: string) {
  if (!value) return "Non renseignee"

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function customerToForm(customer: AdminCustomer | null): CustomerFormState {
  if (!customer) return emptyForm

  return {
    full_name: customer.full_name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    city: customer.city,
    nationality: customer.nationality,
    cin: customer.cin ?? "",
    passport: customer.passport ?? "",
    driving_license_number: customer.driving_license_number,
    driving_license_issued_at: customer.driving_license_issued_at?.slice(0, 10) ?? "",
    driving_license_expires_at: customer.driving_license_expires_at?.slice(0, 10) ?? "",
    driving_license_scan: null,
    identity_document_scan: null,
    password: "",
    is_active: customer.is_active,
    remove_driving_license_scan: false,
    remove_identity_document_scan: false,
  }
}

function buildPayload(form: CustomerFormState, mode: DialogMode): CustomerFormRequest {
  return {
    full_name: form.full_name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    nationality: form.nationality.trim(),
    cin: form.cin.trim() || null,
    passport: form.passport.trim() || null,
    driving_license_number: form.driving_license_number.trim(),
    driving_license_issued_at: form.driving_license_issued_at,
    driving_license_expires_at: form.driving_license_expires_at,
    driving_license_scan: form.driving_license_scan,
    identity_document_scan: form.identity_document_scan,
    password: form.password || (mode === "create" ? "password" : undefined),
    is_active: form.is_active,
    remove_driving_license_scan: form.remove_driving_license_scan,
    remove_identity_document_scan: form.remove_identity_document_scan,
  }
}

function CustomerDialog({
  open,
  mode,
  customer,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  mode: DialogMode
  customer: AdminCustomer | null
  isSaving: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (payload: CustomerFormRequest) => Promise<void>
}) {
  const [form, setForm] = useState<CustomerFormState>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(customerToForm(customer))
  }, [customer, open])

  const handleSubmit = async () => onSubmit(buildPayload(form, mode))

  const isInvalid =
    form.full_name.trim().length === 0 ||
    form.phone.trim().length === 0 ||
    form.email.trim().length === 0 ||
    form.address.trim().length === 0 ||
    form.city.trim().length === 0 ||
    form.nationality.trim().length === 0 ||
    form.driving_license_number.trim().length === 0 ||
    form.driving_license_issued_at.length === 0 ||
    form.driving_license_expires_at.length === 0 ||
    (mode === "create" && form.password.length < 8)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:h-[min(90dvh,760px)] sm:max-w-[760px]">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <DialogTitle>{mode === "create" ? "Ajouter un client" : "Modifier le client"}</DialogTitle>
          <DialogDescription className="mt-1">
            Renseignez les informations administratives et les documents du client.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-full-name">Nom complet</label>
              <Input id="customer-full-name" value={form.full_name} onChange={(e) => setForm((c) => ({ ...c, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-phone">Numero de telephone</label>
              <Input id="customer-phone" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-email">Email</label>
              <Input id="customer-email" type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-city">Ville</label>
              <Input id="customer-city" value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="customer-address">Adresse complete</label>
              <Textarea id="customer-address" value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-nationality">Nationalite</label>
              <Input id="customer-nationality" value={form.nationality} onChange={(e) => setForm((c) => ({ ...c, nationality: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-status">Statut</label>
              <Select value={form.is_active ? "active" : "inactive"} onValueChange={(value) => setForm((c) => ({ ...c, is_active: value === "active" }))}>
                <SelectTrigger id="customer-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-cin">CIN</label>
              <Input id="customer-cin" value={form.cin} onChange={(e) => setForm((c) => ({ ...c, cin: e.target.value }))} placeholder="Clients marocains" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-passport">Passeport</label>
              <Input id="customer-passport" value={form.passport} onChange={(e) => setForm((c) => ({ ...c, passport: e.target.value }))} placeholder="Clients etrangers" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-license">Numero du permis</label>
              <Input id="customer-license" value={form.driving_license_number} onChange={(e) => setForm((c) => ({ ...c, driving_license_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="customer-password">Mot de passe</label>
              <Input id="customer-password" type="password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} placeholder={mode === "edit" ? "Laisser vide pour conserver" : "Minimum 8 caracteres"} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="license-issued">Date de delivrance du permis</label>
              <Input id="license-issued" type="date" value={form.driving_license_issued_at} onChange={(e) => setForm((c) => ({ ...c, driving_license_issued_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="license-expires">Date d&apos;expiration du permis</label>
              <Input id="license-expires" type="date" value={form.driving_license_expires_at} onChange={(e) => setForm((c) => ({ ...c, driving_license_expires_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="license-scan">Photo ou scan du permis</label>
              <Input id="license-scan" type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={(e) => setForm((c) => ({ ...c, driving_license_scan: e.target.files?.[0] ?? null, remove_driving_license_scan: false }))} />
              {customer?.driving_license_scan_url ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={form.remove_driving_license_scan} onCheckedChange={(checked) => setForm((c) => ({ ...c, remove_driving_license_scan: checked === true }))} />
                  Retirer le fichier actuel
                </label>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="identity-scan">Photo ou scan CIN/passeport</label>
              <Input id="identity-scan" type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={(e) => setForm((c) => ({ ...c, identity_document_scan: e.target.files?.[0] ?? null, remove_identity_document_scan: false }))} />
              {customer?.identity_document_scan_url ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={form.remove_identity_document_scan} onCheckedChange={(checked) => setForm((c) => ({ ...c, remove_identity_document_scan: checked === true }))} />
                  Retirer le fichier actuel
                </label>
              ) : null}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSaving || isInvalid}>
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

function getColumns({
  selectedIds,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDelete,
}: {
  selectedIds: string[]
  onToggleAll: (checked: boolean) => void
  onToggleOne: (id: string, checked: boolean) => void
  onEdit: (customer: AdminCustomer) => void
  onDelete: (customer: AdminCustomer) => void
}): ColumnDef<AdminCustomer>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const rows = table.options.data
        const allSelected = rows.length > 0 && rows.every((c) => selectedIds.includes(String(c.id)))
        const someSelected = rows.some((c) => selectedIds.includes(String(c.id)))

        return <Checkbox checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={(checked) => onToggleAll(checked === true)} aria-label="Selectionner tous les clients" />
      },
      cell: ({ row }) => <Checkbox checked={selectedIds.includes(String(row.original.id))} onCheckedChange={(checked) => onToggleOne(String(row.original.id), checked === true)} aria-label={`Selectionner ${row.original.full_name}`} />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: "Client",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium tracking-tight">{customer.full_name}</p>
              <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", customer.is_active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300")}>
                {customer.is_active ? <CircleCheck className="size-3" /> : <CircleOff className="size-3" />}
                {customer.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{customer.email} - {customer.phone}</p>
          </div>
        )
      },
    },
    {
      id: "identity",
      header: "Identite",
      cell: ({ row }) => (
        <div className="space-y-1 text-sm">
          <p>{row.original.nationality}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {row.original.cin ? `CIN ${row.original.cin}` : row.original.passport ? `Passeport ${row.original.passport}` : "Document non renseigne"}
          </p>
        </div>
      ),
    },
    {
      id: "license",
      header: "Permis",
      cell: ({ row }) => (
        <div className="space-y-1 text-sm">
          <p className="font-mono">{row.original.driving_license_number}</p>
          <p className="text-xs text-muted-foreground">
            Expire le {formatDate(row.original.driving_license_expires_at)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Ville",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.city}</span>,
    },
    {
      id: "documents",
      header: "Documents",
      cell: ({ row }) => (
        <div className="flex gap-1.5">
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
            <FileText className="size-3" />
            Permis {row.original.driving_license_scan_url ? "OK" : "manquant"}
          </Badge>
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
            <BadgeCheck className="size-3" />
            ID {row.original.identity_document_scan_url ? "OK" : "manquant"}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission={PERM_CUSTOMERS_EDIT}>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(row.original)} aria-label="Modifier le client">
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30" onClick={() => onDelete(row.original)} aria-label="Supprimer le client">
              <Trash2 className="size-3.5" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ]
}

export function CustomersPage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState<StatusFilter>("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<AdminCustomer | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<boolean | null>(null)

  const customerQueryParams = useMemo(
    () => ({
      search: deferredSearch.trim() || undefined,
      is_active: status === "all" ? undefined : status === "active",
    }),
    [deferredSearch, status]
  )
  const {
    data: customers = EMPTY_CUSTOMERS,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCustomersQuery(customerQueryParams)
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation()
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation()
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()
  const [bulkDeleteCustomers, { isLoading: isBulkDeleting }] = useBulkDeleteCustomersMutation()
  const [bulkUpdateStatus, { isLoading: isBulkUpdating }] = useBulkUpdateCustomerStatusMutation()

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error, "Impossible de charger les clients."))
  }, [error])

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => customers.some((c) => String(c.id) === id))

      if (
        next.length === current.length &&
        next.every((id, index) => id === current[index])
      ) {
        return current
      }

      return next
    })
  }, [customers])

  const toggleAll = (checked: boolean) => setSelectedIds(checked ? customers.map((c) => String(c.id)) : [])
  const toggleOne = (id: string, checked: boolean) => setSelectedIds((current) => checked ? Array.from(new Set([...current, id])) : current.filter((value) => value !== id))

  const columns = useMemo(
    () => getColumns({
      selectedIds,
      onToggleAll: toggleAll,
      onToggleOne: toggleOne,
      onEdit: (customer) => {
        setDialogMode("edit")
        setEditingCustomer(customer)
        setDialogOpen(true)
      },
      onDelete: setDeletingCustomer,
    }),
    [customers, selectedIds]
  )

  const handleCreate = () => {
    setDialogMode("create")
    setEditingCustomer(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (payload: CustomerFormRequest) => {
    try {
      if (dialogMode === "create") {
        await createCustomer(payload).unwrap()
        toast.success("Client cree avec succes.")
      } else if (editingCustomer) {
        await updateCustomer({ customerId: editingCustomer.id, ...payload }).unwrap()
        toast.success("Client modifie avec succes.")
      }

      setDialogOpen(false)
      setEditingCustomer(null)
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Impossible d'enregistrer le client."))
    }
  }

  const handleDelete = async () => {
    if (!deletingCustomer) return

    try {
      await deleteCustomer(deletingCustomer.id).unwrap()
      toast.success("Client supprime.")
      setDeletingCustomer(null)
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Impossible de supprimer le client."))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteCustomers({ customer_ids: selectedIds }).unwrap()
      toast.success(`${selectedIds.length} client(s) supprime(s).`)
      setSelectedIds([])
      setBulkDeleteOpen(false)
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Impossible de supprimer les clients."))
    }
  }

  const handleBulkStatus = async () => {
    if (bulkStatus === null) return

    try {
      await bulkUpdateStatus({ customer_ids: selectedIds, is_active: bulkStatus }).unwrap()
      toast.success(`${selectedIds.length} statut(s) mis a jour.`)
      setSelectedIds([])
      setBulkStatus(null)
    } catch (statusError) {
      toast.error(getErrorMessage(statusError, "Impossible de modifier les statuts."))
    }
  }

  const activeCount = customers.filter((customer) => customer.is_active).length
  const selectedCount = selectedIds.length

  return (
    <ListPageShell
      badge="Location"
      title="Clients"
      description="Gestion des fiches clients, documents d'identite et permis de conduire."
      action={
        <PermissionGate permission={PERM_CUSTOMERS_CREATE}>
          <Button className="w-full md:w-auto" onClick={handleCreate}>
            <Plus className="size-4" />
            Ajouter un client
          </Button>
        </PermissionGate>
      }
    >
      <Card className="brand-panel border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersRound className="size-4 text-primary" />
              Liste des clients
            </CardTitle>
            <CardDescription>
              {customers.length} clients au total, {activeCount} actifs.
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
            <div className="relative min-w-[260px]">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher nom, email, CIN, passeport..." className="pl-9" />
            </div>
            <Select value={status} onValueChange={(value: StatusFilter) => setStatus(value)}>
              <SelectTrigger className="w-full lg:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} aria-label="Actualiser">
              <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4">
          {selectedCount > 0 ? (
            <PermissionGate permission={PERM_CUSTOMERS_EDIT}>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                <Badge variant="outline" className="rounded-full">{selectedCount} selectionne(s)</Badge>
                <Button size="sm" variant="outline" onClick={() => setBulkStatus(true)}>
                  <CircleCheck className="size-3.5" />
                  Activer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBulkStatus(false)}>
                  <CircleOff className="size-3.5" />
                  Desactiver
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="size-3.5" />
                  Supprimer
                </Button>
              </div>
            </PermissionGate>
          ) : null}

          {isLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={customers}
              emptyMessage="Aucun client ne correspond aux filtres."
            />
          )}
        </CardContent>
      </Card>

      <CustomerDialog
        open={dialogOpen}
        mode={dialogMode}
        customer={editingCustomer}
        isSaving={isCreating || isUpdating}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingCustomer)}
        title="Supprimer le client"
        description={deletingCustomer ? `Confirmez la suppression de ${deletingCustomer.full_name}.` : "Confirmez la suppression de ce client."}
        confirmLabel="Supprimer"
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => {
          if (!open) setDeletingCustomer(null)
        }}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Supprimer ${selectedCount} client(s)`}
        description="Cette action supprimera definitivement les clients selectionnes."
        confirmLabel="Supprimer"
        destructive
        isLoading={isBulkDeleting}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
      />

      <ConfirmDialog
        open={bulkStatus !== null}
        title={bulkStatus ? "Activer les clients" : "Desactiver les clients"}
        description={`${selectedCount} client(s) seront ${bulkStatus ? "actives" : "desactives"}.`}
        confirmLabel="Confirmer"
        isLoading={isBulkUpdating}
        onOpenChange={(open) => {
          if (!open) setBulkStatus(null)
        }}
        onConfirm={handleBulkStatus}
      />
    </ListPageShell>
  )
}
