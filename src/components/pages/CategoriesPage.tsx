"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  FolderTree,
  ImageIcon,
  List,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
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
  PERM_CATEGORIES_MANAGE,
  PERM_CATEGORIES_VIEW,
} from "@/lib/permissions"
import { CategoryTreeView } from "@/components/admin/category-tree-view"
import type { AdminCategory } from "@/store/api/categories"
import {
  useBulkDeleteCategoriesMutation,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useGetCategoriesTreeQuery,
  useUpdateCategoryMutation,
} from "@/store/api/categories"

type StatusFilter = "all" | "active" | "inactive"
type ScopeFilter = "all" | "root" | "sub"

type CategoryFormState = {
  parent_id: string
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

function flattenTree(
  categories: AdminCategory[],
  depth = 0,
  accumulator: Array<{ category: AdminCategory; depth: number }> = []
) {
  categories.forEach((category) => {
    accumulator.push({ category, depth })
    flattenTree(category.children ?? [], depth + 1, accumulator)
  })

  return accumulator
}

function CategoryDialog({
  open,
  mode,
  category,
  parentOptions,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  category: AdminCategory | null
  parentOptions: AdminCategory[]
  isSaving: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (payload: CategoryFormState) => Promise<void>
}) {
  const [form, setForm] = useState<CategoryFormState>({
    parent_id: "root",
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
      parent_id: category?.parent_id ? String(category.parent_id) : "root",
      name: category?.name ?? "",
      description: category?.description ?? "",
      image: null,
      is_active: category?.is_active ?? true,
      remove_image: false,
    })
  }, [category, open])

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

  const availableParents = useMemo(
    () => parentOptions.filter((item) => String(item.id) !== String(category?.id ?? "")),
    [category?.id, parentOptions]
  )

  const handleSubmit = async () => {
    await onSubmit({
      parent_id: form.parent_id,
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image,
      is_active: form.is_active,
      remove_image: form.remove_image,
    })
  }

  const currentImageUrl = !form.remove_image ? category?.image_url ?? null : null
  const previewImageUrl = imagePreviewUrl ?? currentImageUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[580px]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>
            {mode === "create" ? "Ajouter une categorie" : "Modifier la categorie"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            Creez une categorie racine ou rattachez-la a une categorie parente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categorie parente</label>
            <Select
              value={form.parent_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, parent_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir la categorie parente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Aucune categorie parente</SelectItem>
                {availableParents.map((parent) => (
                  <SelectItem key={parent.id} value={String(parent.id)}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="category-name">
              Nom
            </label>
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex: Stylos gel"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="category-description">
              Description
            </label>
            <Textarea
              id="category-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Presentation courte de la categorie"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="category-image">
              Image
            </label>
            <Input
              id="category-image"
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
                  alt="Apercu de la categorie"
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex gap-2">
                  {category?.image_url ? (
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

function DeleteCategoryDialog({
  category,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  category: AdminCategory | null
  open: boolean
  isDeleting: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Supprimer la categorie</DialogTitle>
          <DialogDescription>
            {category
              ? `Confirmez la suppression de ${category.name}.`
              : "Confirmez la suppression de cette categorie."}
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
  onEdit: (category: AdminCategory) => void
  onDelete: (category: AdminCategory) => void
}): ColumnDef<AdminCategory>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const rows = table.options.data
        const allSelected = rows.length > 0 && rows.every((c) => selectedIds.includes(String(c.id)))
        const someSelected = rows.some((c) => selectedIds.includes(String(c.id)))

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
        const category = row.original

        return category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
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
      header: "Categorie",
      cell: ({ row }) => {
        const category = row.original
        const isSubcategory = Boolean(category.parent_id)

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-medium tracking-tight">{category.name}</p>
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
                {isSubcategory ? "Sous-categorie" : "Racine"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  category.is_active
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                )}
              >
                {category.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground line-clamp-1 max-w-xs text-xs">
              {category.description?.trim() || "Aucune description"}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "parent.name",
      header: "Parent",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.parent?.name ?? "Racine"}
        </span>
      ),
    },
    {
      id: "children",
      header: "Sous-cat.",
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-full">
          {(row.original.children ?? []).length}
        </Badge>
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

export function CategoriesPage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState<StatusFilter>("all")
  const [scope, setScope] = useState<ScopeFilter>("all")
  const [viewMode, setViewMode] = useState<"list" | "tree">("list")
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<AdminCategory | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const {
    data: categories = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCategoriesQuery()
  const { data: categoryTree = [] } = useGetCategoriesTreeQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()
  const [bulkDeleteCategories, { isLoading: isBulkDeleting }] = useBulkDeleteCategoriesMutation()

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories]
  )

  const filteredCategories = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()

    return categories.filter((category) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        (category.description ?? "").toLowerCase().includes(normalizedSearch) ||
        (category.parent?.name ?? "").toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        status === "all" ||
        (status === "active" && category.is_active) ||
        (status === "inactive" && !category.is_active)

      const matchesScope =
        scope === "all" ||
        (scope === "root" && !category.parent_id) ||
        (scope === "sub" && Boolean(category.parent_id))

      return matchesSearch && matchesStatus && matchesScope
    })
  }, [categories, deferredSearch, scope, status])

  const flatTree = useMemo(() => flattenTree(categoryTree), [categoryTree])

  const handleToggleAll = (checked: boolean) => {
    setSelectedCategoryIds(checked ? filteredCategories.map((c) => String(c.id)) : [])
  }

  const handleToggleOne = (id: string, checked: boolean) => {
    setSelectedCategoryIds((current) =>
      checked ? [...current, id] : current.filter((v) => v !== id)
    )
  }

  const columns = useMemo(
    () =>
      getColumns({
        canManage: true,
        selectedIds: selectedCategoryIds,
        onToggleAll: handleToggleAll,
        onToggleOne: handleToggleOne,
        onEdit: (category) => {
          setDialogMode("edit")
          setCategoryToEdit(category)
          setIsDialogOpen(true)
        },
        onDelete: (category) => setCategoryToDelete(category),
      }),
    [selectedCategoryIds, filteredCategories]
  )

  const handleCreateClick = () => {
    setDialogMode("create")
    setCategoryToEdit(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (payload: CategoryFormState) => {
    const parentId = payload.parent_id === "root" ? null : payload.parent_id

    try {
      if (dialogMode === "create") {
        await createCategory({
          name: payload.name,
          description: payload.description || null,
          parent_id: parentId,
          image: payload.image,
          is_active: payload.is_active,
        }).unwrap()
        toast.success("Categorie creee avec succes.")
      } else if (categoryToEdit) {
        await updateCategory({
          categoryId: categoryToEdit.id,
          name: payload.name,
          description: payload.description || null,
          parent_id: parentId,
          image: payload.image,
          is_active: payload.is_active,
          remove_image: payload.remove_image,
        }).unwrap()
        toast.success("Categorie mise a jour avec succes.")
      }

      setIsDialogOpen(false)
      setCategoryToEdit(null)
    } catch (submitError) {
      toast.error(
        getErrorMessage(
          submitError,
          "Impossible d'enregistrer la categorie pour le moment."
        )
      )
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) {
      return
    }

    try {
      await deleteCategory(categoryToDelete.id).unwrap()
      toast.success("Categorie supprimee avec succes.")
      setCategoryToDelete(null)
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError, "Impossible de supprimer la categorie.")
      )
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCategoryIds.length === 0) return

    try {
      await bulkDeleteCategories({ category_ids: selectedCategoryIds }).unwrap()
      toast.success(`${selectedCategoryIds.length} categorie(s) supprimee(s).`)
      setSelectedCategoryIds([])
      setBulkDeleteOpen(false)
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError, "Impossible de supprimer les categories.")
      )
    }
  }

  const subcategoriesCount = categories.filter((category) => category.parent_id).length
  const selectedCount = selectedCategoryIds.length

  return (
    <PageGuard
      anyPermission={[PERM_CATEGORIES_VIEW, PERM_CATEGORIES_MANAGE]}
      page="Categories"
    >
      <ListPageShell
        badge="Catalogue"
        title="Gestion des categories"
        description="Gerez les categories et sous-categories avec le meme systeme de composants Shadcn que le reste du dashboard."
        action={
          <PermissionGate anyPermission={[PERM_CATEGORIES_MANAGE]}>
            <Button className="w-full md:w-auto" onClick={handleCreateClick}>
              <Plus className="size-4" />
              Ajouter une categorie
            </Button>
          </PermissionGate>
        }
      >
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-4 border-b border-border/70 pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderTree className="size-4 text-primary" />
                    Categories et sous-categories
                  </CardTitle>
                  <CardDescription>
                    {rootCategories.length} racines, {subcategoriesCount} sous-categories.
                  </CardDescription>
                </div>

                <div className="flex rounded-lg border border-border/70 p-0.5">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-xs"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="size-3.5" />
                    Liste
                  </Button>
                  <Button
                    variant={viewMode === "tree" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-xs"
                    onClick={() => setViewMode("tree")}
                  >
                    <FolderTree className="size-3.5" />
                    Arborescence
                  </Button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
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
                    placeholder="Rechercher une categorie"
                    className="pl-9"
                  />
                </div>

                <Select value={scope} onValueChange={(value: ScopeFilter) => setScope(value)}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="root">Categories racines</SelectItem>
                    <SelectItem value="sub">Sous-categories</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={(value: StatusFilter) => setStatus(value)}>
                  <SelectTrigger className="w-full lg:w-[180px]">
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
                  aria-label="Actualiser les categories"
                >
                  <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
                </Button>
              </div>
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
                  {getErrorMessage(error, "Impossible de charger les categories.")}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Reessayer
                </Button>
              </div>
            ) : viewMode === "tree" ? (
              <div className="px-4 py-2">
                <CategoryTreeView
                  tree={categoryTree}
                  canManage={true}
                  onEdit={(category) => {
                    setDialogMode("edit")
                    setCategoryToEdit(category)
                    setIsDialogOpen(true)
                  }}
                  onDelete={(category) => setCategoryToDelete(category)}
                />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredCategories}
                emptyMessage="Aucune categorie ne correspond aux filtres."
              />
            )}
          </CardContent>
        </Card>

        <CategoryDialog
          open={isDialogOpen}
          mode={dialogMode}
          category={categoryToEdit}
          parentOptions={rootCategories}
          isSaving={isCreating || isUpdating}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmit}
        />

        <DeleteCategoryDialog
          category={categoryToDelete}
          open={Boolean(categoryToDelete)}
          isDeleting={isDeleting}
          onOpenChange={(open) => {
            if (!open) {
              setCategoryToDelete(null)
            }
          }}
          onConfirm={handleDelete}
        />

        <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Supprimer {selectedCount} categorie(s)</DialogTitle>
              <DialogDescription>
                Cette action est irreversible. Les categories selectionnees seront supprimees.
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
