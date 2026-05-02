"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Tag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { PageGuard, PermissionGate } from "@/components/auth/permission-gate"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  PERM_BRANDS_MANAGE,
  PERM_BRANDS_VIEW,
} from "@/lib/permissions"
import type { AdminBrand } from "@/store/api/brands"
import {
  useBulkDeleteBrandsMutation,
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useGetBrandsQuery,
  useUpdateBrandMutation,
} from "@/store/api/brands"

type StatusFilter = "all" | "active" | "inactive"

type BrandFormState = {
  name: string
  description: string
  image: File | null
  is_active: boolean
  remove_image: boolean
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const candidate = error as {
      data?: { message?: unknown }
      error?: string
    }

    if (typeof candidate.data?.message === "string") {
      return candidate.data.message
    }

    if (typeof candidate.error === "string") {
      return candidate.error
    }
  }

  return fallback
}

function formatDate(value?: string) {
  if (!value) {
    return "Non disponible"
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function BrandDialog({
  open,
  mode,
  brand,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  brand: AdminBrand | null
  isSaving: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (payload: BrandFormState) => Promise<void>
}) {
  const [form, setForm] = useState<BrandFormState>({
    name: "",
    description: "",
    image: null,
    is_active: true,
    remove_image: false,
  })
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setForm({
      name: brand?.name ?? "",
      description: brand?.description ?? "",
      image: null,
      is_active: brand?.is_active ?? true,
      remove_image: false,
    })
  }, [brand, open])

  useEffect(() => {
    if (!form.image) {
      setImagePreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(form.image)
    setImagePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [form.image])

  const handleSubmit = async () => {
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image,
      is_active: form.is_active,
      remove_image: form.remove_image,
    })
  }

  const currentImageUrl = !form.remove_image ? brand?.image_url ?? null : null
  const previewImageUrl = imagePreviewUrl ?? currentImageUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>
            {mode === "create" ? "Ajouter une marque" : "Modifier la marque"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            Renseignez les informations de la marque pour le catalogue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brand-name">
              Nom
            </label>
            <Input
              id="brand-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex: Pilot"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="brand-description">
              Description
            </label>
            <Textarea
              id="brand-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Presentation courte de la marque"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="brand-image">
              Image
            </label>
            <Input
              id="brand-image"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setForm((current) => ({
                  ...current,
                  image: file,
                  remove_image: file ? false : current.remove_image,
                }))
              }}
            />
            {previewImageUrl ? (
              <div className="space-y-2 rounded-xl border border-border/70 p-3">
                <img
                  src={previewImageUrl}
                  alt="Apercu de la marque"
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex gap-2">
                  {brand?.image_url ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          image: null,
                          remove_image: true,
                        }))
                      }
                    >
                      Retirer l&apos;image
                    </Button>
                  ) : null}
                  {form.image ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setForm((current) => ({ ...current, image: null }))
                      }}
                    >
                      Annuler le fichier
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                JPG, PNG ou WEBP, maximum 2 MB.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <Select
              value={form.is_active ? "active" : "inactive"}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  is_active: value === "active",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteBrandDialog({
  brand,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  brand: AdminBrand | null
  open: boolean
  isDeleting: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Supprimer la marque</DialogTitle>
          <DialogDescription>
            {brand
              ? `Confirmez la suppression de ${brand.name}.`
              : "Confirmez la suppression de cette marque."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getColumns({
  canManage,
  selectedIds,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDelete,
}: {
  canManage: boolean
  selectedIds: string[]
  onToggleAll: (checked: boolean) => void
  onToggleOne: (id: string, checked: boolean) => void
  onEdit: (brand: AdminBrand) => void
  onDelete: (brand: AdminBrand) => void
}): ColumnDef<AdminBrand>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const rows = table.options.data
        const allSelected = rows.length > 0 && rows.every((b) => selectedIds.includes(String(b.id)))
        const someSelected = rows.some((b) => selectedIds.includes(String(b.id)))

        return (
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => onToggleAll(checked === true)}
            aria-label="Selectionner tout"
          />
        )
      },
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.includes(String(row.original.id))}
          onCheckedChange={(checked) => onToggleOne(String(row.original.id), checked === true)}
          aria-label={`Selectionner ${row.original.name}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => {
        const brand = row.original

        return brand.image_url ? (
          <img
            src={brand.image_url}
            alt={brand.name}
            className="size-10 rounded-lg border border-border/50 object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30">
            <ImageIcon className="size-4 text-muted-foreground" />
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: "Marque",
      cell: ({ row }) => {
        const brand = row.original

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-medium tracking-tight">{brand.name}</p>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  brand.is_active
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                )}
              >
                {brand.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground line-clamp-1 max-w-xs text-xs">
              {brand.description?.trim() || "Aucune description"}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Creation",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        if (!canManage) return null

        return (
          <div className="flex items-center justify-end gap-1">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(row.original)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Modifier</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => onDelete(row.original)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]
}

export function BrandsPage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState<StatusFilter>("all")
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [brandToEdit, setBrandToEdit] = useState<AdminBrand | null>(null)
  const [brandToDelete, setBrandToDelete] = useState<AdminBrand | null>(null)
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const {
    data: brands = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetBrandsQuery()
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation()
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation()
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation()
  const [bulkDeleteBrands, { isLoading: isBulkDeleting }] = useBulkDeleteBrandsMutation()

  const filteredBrands = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()

    return brands.filter((brand) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        brand.name.toLowerCase().includes(normalizedSearch) ||
        (brand.description ?? "").toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        status === "all" ||
        (status === "active" && brand.is_active) ||
        (status === "inactive" && !brand.is_active)

      return matchesSearch && matchesStatus
    })
  }, [brands, deferredSearch, status])

  const handleToggleAll = (checked: boolean) => {
    setSelectedBrandIds(checked ? filteredBrands.map((b) => String(b.id)) : [])
  }

  const handleToggleOne = (id: string, checked: boolean) => {
    setSelectedBrandIds((current) =>
      checked ? [...current, id] : current.filter((v) => v !== id)
    )
  }

  const columns = useMemo(
    () =>
      getColumns({
        canManage: true,
        selectedIds: selectedBrandIds,
        onToggleAll: handleToggleAll,
        onToggleOne: handleToggleOne,
        onEdit: (brand) => {
          setDialogMode("edit")
          setBrandToEdit(brand)
          setIsDialogOpen(true)
        },
        onDelete: (brand) => setBrandToDelete(brand),
      }),
    [selectedBrandIds, filteredBrands]
  )

  const handleCreateClick = () => {
    setDialogMode("create")
    setBrandToEdit(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (payload: BrandFormState) => {
    try {
      if (dialogMode === "create") {
        await createBrand({
          name: payload.name,
          description: payload.description || null,
          image: payload.image,
          is_active: payload.is_active,
        }).unwrap()
        toast.success("Marque creee avec succes.")
      } else if (brandToEdit) {
        await updateBrand({
          brandId: brandToEdit.id,
          name: payload.name,
          description: payload.description || null,
          image: payload.image,
          is_active: payload.is_active,
          remove_image: payload.remove_image,
        }).unwrap()
        toast.success("Marque mise a jour avec succes.")
      }

      setIsDialogOpen(false)
      setBrandToEdit(null)
    } catch (submitError) {
      toast.error(
        getErrorMessage(
          submitError,
          "Impossible d'enregistrer la marque pour le moment."
        )
      )
    }
  }

  const handleDelete = async () => {
    if (!brandToDelete) {
      return
    }

    try {
      await deleteBrand(brandToDelete.id).unwrap()
      toast.success("Marque supprimee avec succes.")
      setBrandToDelete(null)
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError, "Impossible de supprimer la marque.")
      )
    }
  }

  const handleBulkDelete = async () => {
    if (selectedBrandIds.length === 0) return

    try {
      await bulkDeleteBrands({ brand_ids: selectedBrandIds }).unwrap()
      toast.success(`${selectedBrandIds.length} marque(s) supprimee(s).`)
      setSelectedBrandIds([])
      setBulkDeleteOpen(false)
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError, "Impossible de supprimer les marques.")
      )
    }
  }

  const activeCount = brands.filter((brand) => brand.is_active).length
  const selectedCount = selectedBrandIds.length

  return (
    <PageGuard
      anyPermission={[PERM_BRANDS_VIEW, PERM_BRANDS_MANAGE]}
      page="Marques"
    >
      <ListPageShell
        badge="Catalogue"
        title="Gestion des marques"
        description="Administrez les marques du catalogue avec la meme experience que les autres ecrans du back-office."
        action={
          <PermissionGate anyPermission={[PERM_BRANDS_MANAGE]}>
            <Button className="w-full md:w-auto" onClick={handleCreateClick}>
              <Plus className="size-4" />
              Ajouter une marque
            </Button>
          </PermissionGate>
        }
      >
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="size-4 text-primary" />
                Marques
              </CardTitle>
              <CardDescription>
                {brands.length} marques au total, {activeCount} actives.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {selectedCount > 0 ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Supprimer ({selectedCount})
                </Button>
              ) : null}

              <div className="relative min-w-[240px]">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une marque"
                  className="pl-9"
                />
              </div>

              <Select value={status} onValueChange={(value: StatusFilter) => setStatus(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="inactive">Inactives</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Actualiser les marques"
              >
                <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
              </div>
            ) : error ? (
              <div className="space-y-3 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {getErrorMessage(error, "Impossible de charger les marques.")}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Reessayer
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredBrands}
                emptyMessage="Aucune marque ne correspond aux filtres."
              />
            )}
          </CardContent>
        </Card>

        <BrandDialog
          open={isDialogOpen}
          mode={dialogMode}
          brand={brandToEdit}
          isSaving={isCreating || isUpdating}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmit}
        />

        <DeleteBrandDialog
          brand={brandToDelete}
          open={Boolean(brandToDelete)}
          isDeleting={isDeleting}
          onOpenChange={(open) => {
            if (!open) {
              setBrandToDelete(null)
            }
          }}
          onConfirm={handleDelete}
        />

        <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Supprimer {selectedCount} marque(s)</DialogTitle>
              <DialogDescription>
                Cette action est irreversible. Les marques selectionnees seront supprimees.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={isBulkDeleting}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                {isBulkDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ListPageShell>
    </PageGuard>
  )
}
