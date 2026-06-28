"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { ColumnDef } from "@tanstack/react-table"
import {
  FolderTree,
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
import { PageGuard, PermissionGate } from "@/components/auth/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  PERM_VEHICLE_CATEGORIES_MANAGE,
  PERM_VEHICLE_CATEGORIES_VIEW,
} from "@/lib/permissions"
import type { VehicleCategory, VehicleCategoryFormRequest } from "@/store/api/vehicles"
import {
  useCreateVehicleCategoryMutation,
  useDeleteVehicleCategoryMutation,
  useGetVehicleCategoriesQuery,
  useUpdateVehicleCategoryMutation,
} from "@/store/api/vehicles"

type DialogMode = "create" | "edit"
type Translator = ReturnType<typeof useTranslations>

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const candidate = error as { data?: { message?: unknown }; error?: string }
    if (typeof candidate.data?.message === "string") return candidate.data.message
    if (typeof candidate.error === "string") return candidate.error
  }

  return fallback
}

function VehicleCategoryDialog({
  open,
  mode,
  category,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  mode: DialogMode
  category: VehicleCategory | null
  isSaving: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (payload: VehicleCategoryFormRequest) => Promise<void>
}) {
  const t = useTranslations("Categories")
  const tc = useTranslations("Common")
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  })

  useEffect(() => {
    if (!open) return

    setForm({
      name: category?.name ?? "",
      description: category?.description ?? "",
      is_active: category?.is_active ?? true,
    })
  }, [category, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[88dvh] flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-w-[540px]">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <DialogTitle>
            {mode === "create" ? t("dialogCreate") : t("dialogEdit")}
          </DialogTitle>
          <DialogDescription>
            {t("dialogDesc")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-category-name">
                {t("nameLabel")}
              </label>
              <Input
                id="vehicle-category-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={t("namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="vehicle-category-description">
                {t("descriptionLabel")}
              </label>
              <Textarea
                id="vehicle-category-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, is_active: checked === true }))
                }
              />
              <span className="text-sm font-medium">{t("activeLabel")}</span>
            </label>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                name: form.name.trim(),
                description: form.description.trim() || null,
                is_active: form.is_active,
              })
            }
            disabled={isSaving || form.name.trim().length === 0}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  category,
  isDeleting,
  onClose,
  onConfirm,
}: {
  category: VehicleCategory | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const t = useTranslations("Categories")
  const tc = useTranslations("Common")
  return (
    <Dialog open={Boolean(category)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("deleteTitle")}</DialogTitle>
          <DialogDescription>
            {category
              ? t("deleteConfirmNamed", { name: category.name })
              : t("deleteConfirm")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {tc("cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            {tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getColumns({
  t,
  onEdit,
  onDelete,
}: {
  t: Translator
  onEdit: (category: VehicleCategory) => void
  onDelete: (category: VehicleCategory) => void
}): ColumnDef<VehicleCategory>[] {
  return [
    {
      accessorKey: "name",
      header: t("colCategory"),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium tracking-tight">{row.original.name}</p>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                row.original.is_active
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              )}
            >
              {row.original.is_active ? t("active") : t("inactive")}
            </Badge>
          </div>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.description || t("noDescription")}
          </p>
        </div>
      ),
    },
    {
      id: "vehicles_count",
      header: t("colVehicles"),
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-full">
          {row.original.vehicles_count ?? 0}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <PermissionGate permission={PERM_VEHICLE_CATEGORIES_MANAGE}>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </PermissionGate>
      ),
    },
  ]
}

export function CategoriesPage() {
  const t = useTranslations("Categories")
  const tc = useTranslations("Common")
  const [search, setSearch] = useState("")
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<VehicleCategory | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<VehicleCategory | null>(null)

  const {
    data: categories = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetVehicleCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateVehicleCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateVehicleCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteVehicleCategoryMutation()

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error, t("loadError")))
    }
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) return categories

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(normalizedSearch) ||
        (category.description ?? "").toLowerCase().includes(normalizedSearch)
      )
    })
  }, [categories, search])

  const columns = useMemo(
    () =>
      getColumns({
        t,
        onEdit: (category) => {
          setDialogMode("edit")
          setCategoryToEdit(category)
          setDialogOpen(true)
        },
        onDelete: setCategoryToDelete,
      }),
    [t]
  )

  const handleCreateClick = () => {
    setDialogMode("create")
    setCategoryToEdit(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (payload: VehicleCategoryFormRequest) => {
    try {
      if (dialogMode === "create") {
        await createCategory(payload).unwrap()
        toast.success(t("created"))
      } else if (categoryToEdit) {
        await updateCategory({ categoryId: categoryToEdit.id, ...payload }).unwrap()
        toast.success(t("updated"))
      }

      setDialogOpen(false)
      setCategoryToEdit(null)
    } catch (submitError) {
      toast.error(
        getErrorMessage(submitError, t("saveError"))
      )
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    try {
      await deleteCategory(categoryToDelete.id).unwrap()
      toast.success(t("deleted"))
      setCategoryToDelete(null)
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError, t("deleteError"))
      )
    }
  }

  const activeCount = categories.filter((category) => category.is_active).length

  return (
    <PageGuard
      anyPermission={[PERM_VEHICLE_CATEGORIES_VIEW, PERM_VEHICLE_CATEGORIES_MANAGE]}
      page="Categories"
    >
      <ListPageShell
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
        action={
          <PermissionGate permission={PERM_VEHICLE_CATEGORIES_MANAGE}>
            <Button className="w-full md:w-auto" onClick={handleCreateClick}>
              <Plus className="size-4" />
              {t("addCategory")}
            </Button>
          </PermissionGate>
        }
      >
        <Card className="brand-panel border-border/70">
          <CardHeader className="gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderTree className="size-4 text-primary" />
                {t("categories")}
              </CardTitle>
              <CardDescription>
                {t("summary", { count: categories.length, active: activeCount })}
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative min-w-[260px]">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label={tc("refresh")}
              >
                <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredCategories}
                emptyMessage={t("empty")}
              />
            )}
          </CardContent>
        </Card>

        <VehicleCategoryDialog
          open={dialogOpen}
          mode={dialogMode}
          category={categoryToEdit}
          isSaving={isCreating || isUpdating}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
        />

        <DeleteDialog
          category={categoryToDelete}
          isDeleting={isDeleting}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={handleDelete}
        />
      </ListPageShell>
    </PageGuard>
  )
}
