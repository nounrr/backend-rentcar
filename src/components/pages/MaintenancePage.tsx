"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, CheckCircle2, Clock, Droplet, Loader2, Plus, RefreshCcw, Wrench } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/admin/data-table"
import { ListPageShell } from "@/components/admin/list-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  useCreateOilChangeMutation,
  useGetMaintenanceOverviewQuery,
} from "@/store/api/oil-changes"
import type { MaintenanceOverviewRow, MaintenanceStatus } from "@/store/api/oil-changes"
import {
  useCreateMaintenanceRecordMutation,
  useGetMaintenanceRecordsQuery,
} from "@/store/api/maintenance-records"
import type { MaintenanceRecordType } from "@/store/api/maintenance-records"

const STATUS_META: Record<MaintenanceStatus, { labelKey: string; cls: string; icon: typeof CheckCircle2 }> = {
  ok:        { labelKey: "statusOk",      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15", icon: CheckCircle2 },
  soon:      { labelKey: "statusSoon",    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15",       icon: Clock },
  overdue:   { labelKey: "statusOverdue", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15",            icon: AlertTriangle },
  unknown:   { labelKey: "statusUnknown", cls: "bg-muted text-muted-foreground hover:bg-muted",                                    icon: Wrench },
}

function formatKm(n: number | null | undefined) {
  if (n === null || n === undefined) return "—"
  return `${n.toLocaleString("fr-FR")} km`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type OilChangeForm = {
  type: "oil_change" | MaintenanceRecordType
  vehicle_id: string
  title: string
  mileage_km: string
  performed_at: string
  cost: string
  reference: string
  notes: string
}

const emptyForm: OilChangeForm = {
  type: "oil_change",
  vehicle_id: "",
  title: "",
  mileage_km: "",
  performed_at: todayISO(),
  cost: "",
  reference: "",
  notes: "",
}

export function MaintenancePage() {
  const t = useTranslations("Maintenance")
  const tc = useTranslations("Common")
  const { data: rows = [], isLoading, isFetching, refetch } = useGetMaintenanceOverviewQuery()
  const { data: maintenanceRecords = [] } = useGetMaintenanceRecordsQuery()
  const [createOilChange, { isLoading: isSaving }] = useCreateOilChangeMutation()
  const [createMaintenanceRecord, { isLoading: isSavingRecord }] = useCreateMaintenanceRecordMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<OilChangeForm>(emptyForm)

  const set = (patch: Partial<OilChangeForm>) => setForm((f) => ({ ...f, ...patch }))

  const maintenanceVehicleOption = (row: MaintenanceOverviewRow): SearchableSelectOption => {
    const vehicle = row.vehicle
    return {
      value: String(vehicle.id),
      label: `${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})`,
      description: `${formatKm(row.current_mileage)} - ${t(STATUS_META[row.status]?.labelKey ?? "statusLabel")}`,
      searchText: [vehicle.brand, vehicle.model, vehicle.registration_number].filter(Boolean).join(" "),
    }
  }

  const vehicleOptions = useMemo(() => rows.map(maintenanceVehicleOption), [rows]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const ok = rows.filter((r) => r.status === "ok").length
    const soon = rows.filter((r) => r.status === "soon").length
    const overdue = rows.filter((r) => r.status === "overdue").length
    return { ok, soon, overdue, total: rows.length }
  }, [rows])

  const openCreate = (vehicleId?: number | string, suggestedKm?: number, type: OilChangeForm["type"] = "oil_change") => {
    setForm({
      ...emptyForm,
      type,
      title: type === "accident" ? t("accident") : type === "free" ? t("freeMaintenance") : "",
      vehicle_id: vehicleId ? String(vehicleId) : "",
      mileage_km: suggestedKm !== undefined ? String(suggestedKm) : "",
    })
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.vehicle_id || !form.performed_at) {
      toast.error(t("errVehicleDateRequired"))
      return
    }

    if (form.type === "oil_change" && !form.mileage_km) {
      toast.error(t("errMileageRequired"))
      return
    }

    if (form.type !== "oil_change" && !form.title.trim()) {
      toast.error(t("errTitleRequired"))
      return
    }

    try {
      if (form.type === "oil_change") {
        await createOilChange({
          vehicle_id: Number(form.vehicle_id),
          mileage_km: Number(form.mileage_km),
          performed_at: form.performed_at,
          cost: form.cost ? Number(form.cost) : undefined,
          reference: form.reference.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }).unwrap()
        toast.success(t("oilChangeSaved"))
      } else {
        await createMaintenanceRecord({
          vehicle_id: Number(form.vehicle_id),
          type: form.type,
          title: form.title.trim(),
          performed_at: form.performed_at,
          mileage_km: form.mileage_km ? Number(form.mileage_km) : undefined,
          cost: form.cost ? Number(form.cost) : undefined,
          reference: form.reference.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }).unwrap()
        toast.success(t("maintenanceSaved"))
      }
      setDialogOpen(false)
    } catch (e) {
      const message =
        e && typeof e === "object" && "data" in e && e.data && typeof e.data === "object" && "message" in e.data
          ? String((e.data as { message: unknown }).message)
          : t("saveError")
      toast.error(message)
    }
  }

  const columns: ColumnDef<MaintenanceOverviewRow>[] = useMemo(
    () => [
      {
        id: "vehicle",
        header: t("vehicle"),
        cell: ({ row }) => {
          const v = row.original.vehicle
          return (
            <div>
              <p className="font-medium">{v.brand} {v.model}</p>
              <p className="font-mono text-xs text-muted-foreground">{v.registration_number}</p>
            </div>
          )
        },
      },
      {
        id: "current_mileage",
        header: t("currentKm"),
        cell: ({ row }) => <span className="tabular-nums">{formatKm(row.original.current_mileage)}</span>,
      },
      {
        id: "last",
        header: t("lastOilChange"),
        cell: ({ row }) => {
          const r = row.original
          if (r.last_oil_change_km === null && !r.last_oil_change_at) {
            return <span className="text-muted-foreground">{t("never")}</span>
          }
          return (
            <div className="text-sm">
              <p className="tabular-nums">{formatKm(r.last_oil_change_km)}</p>
              <p className="text-xs text-muted-foreground">{r.last_oil_change_at ?? "—"}</p>
            </div>
          )
        },
      },
      {
        id: "next",
        header: t("next"),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatKm(row.original.next_oil_change_km)}</span>
        ),
      },
      {
        id: "remaining",
        header: t("remaining"),
        cell: ({ row }) => {
          const km = row.original.km_remaining
          if (km === null) return <span className="text-muted-foreground">—</span>
          const cls = row.original.status === "overdue" ? "text-rose-600 font-semibold" : row.original.status === "soon" ? "text-amber-600 font-semibold" : "tabular-nums"
          return <span className={cls + " tabular-nums"}>{km <= 0 ? `-${Math.abs(km).toLocaleString("fr-FR")} km` : formatKm(km)}</span>
        },
      },
      {
        id: "status",
        header: t("statusLabel"),
        cell: ({ row }) => {
          const meta = STATUS_META[row.original.status]
          const Icon = meta.icon
          return (
            <Badge className={meta.cls}>
              <Icon className="mr-1 size-3" />
              {t(meta.labelKey)}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openCreate(row.original.vehicle.id, row.original.current_mileage, "oil_change")}
          >
            <Droplet className="size-3.5" />
            {t("oilChange")}
          </Button>
        ),
      },
    ],
    [t] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <ListPageShell
      badge={t("badge")}
      title={t("title")}
      description={t("description")}
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            {tc("refresh")}
          </Button>
          <Button onClick={() => openCreate(undefined, undefined, "free")}>
            <Plus className="size-4" />
            {t("addMaintenance")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("fleet")}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("statusOk")}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{stats.ok}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("statusSoon")}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">{stats.soon}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{t("statusOverdue")}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">{stats.overdue}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("trackingByVehicle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage={t("noVehicleInFleet")}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("nonOilMaintenance")}</CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceRecords.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noAccidentFree")}</p>
          ) : (
            <div className="space-y-2">
              {maintenanceRecords.slice(0, 10).map((record) => (
                <div key={String(record.id)} className="flex flex-col gap-2 rounded-md border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{record.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.vehicle ? `${record.vehicle.brand} ${record.vehicle.model} (${record.vehicle.registration_number})` : t("vehicle")} - {record.performed_at}
                    </p>
                  </div>
                  <Badge className={record.type === "accident" ? "bg-rose-500/15 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300" : "bg-muted text-muted-foreground hover:bg-muted"}>
                    {record.type === "accident" ? t("accident") : t("free")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("addMaintenance")}</DialogTitle>
            <DialogDescription>
              {t("chooseType")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("typeLabel")}</label>
              <Select value={form.type} onValueChange={(v) => set({ type: v as OilChangeForm["type"], title: v === "accident" ? t("accident") : v === "free" ? t("freeMaintenance") : "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oil_change">{t("oilChange")}</SelectItem>
                  <SelectItem value="accident">{t("accident")}</SelectItem>
                  <SelectItem value="free">{t("free")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("vehicleRequired")}</label>
              <SearchableSelect
                value={form.vehicle_id}
                options={vehicleOptions}
                onValueChange={(v) => set({ vehicle_id: v })}
                placeholder={t("chooseVehicle")}
                searchPlaceholder={t("searchVehicle")}
                emptyMessage={t("noVehicleFound")}
              />
            </div>
            {form.type !== "oil_change" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("titleRequired")}</label>
                <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder={t("titlePlaceholder")} />
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("mileageLabel")} {form.type === "oil_change" ? "*" : ""}</label>
                <Input type="number" min="0" value={form.mileage_km} onChange={(e) => set({ mileage_km: e.target.value })} placeholder={t("mileagePlaceholder")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("dateRequired")}</label>
                <Input type="date" value={form.performed_at} onChange={(e) => set({ performed_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("costLabel")}</label>
                <Input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set({ cost: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("referenceLabel")}</label>
                <Input value={form.reference} onChange={(e) => set({ reference: e.target.value })} placeholder={t("referencePlaceholder")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("notesLabel")}</label>
              <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder={t("notesPlaceholder")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving || isSavingRecord}>{tc("cancel")}</Button>
            <Button onClick={submit} disabled={isSaving || isSavingRecord}>
              {isSaving || isSavingRecord ? <Loader2 className="size-4 animate-spin" /> : null}
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageShell>
  )
}
