"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import {
  PERM_ROLES_MANAGE,
  PERM_ROLES_VIEW,
} from "@/lib/permissions"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AdminPermission } from "@/store/api/permissions"
import { useGetPermissionsQuery } from "@/store/api/permissions"
import type { AdminRole, RoleId } from "@/store/api/roles"
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetRolesQuery,
  useUpdateRoleMutation,
} from "@/store/api/roles"

type RoleFormState = {
  name: string
  permissionNames: string[]
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

function groupPermissionLabel(permissionName: string) {
  const [resource = "general"] = permissionName.split(".")
  return resource.replace(/[-_]/g, " ")
}

function RoleActionMenu({
  role,
  canManage,
  onEdit,
  onDelete,
}: {
  role: AdminRole
  canManage: boolean
  onEdit: (role: AdminRole) => void
  onDelete: (role: AdminRole) => void
}) {
  if (!canManage) {
    return null
  }

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(role)}
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
              onClick={() => onDelete(role)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Supprimer</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function RoleDialog({
  open,
  mode,
  role,
  permissions,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  role: AdminRole | null
  permissions: AdminPermission[]
  isSaving: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (payload: RoleFormState) => Promise<void>
}) {
  const [form, setForm] = useState<RoleFormState>({ name: "", permissionNames: [] })
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) {
      return
    }

    setForm({
      name: role?.name ?? "",
      permissionNames: role?.permissions?.map((permission) => permission.name) ?? [],
    })
    setSearch("")
  }, [open, role])

  const groupedPermissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = permissions.filter((permission) =>
      permission.name.toLowerCase().includes(normalizedSearch)
    )

    return filtered.reduce<Record<string, AdminPermission[]>>((accumulator, permission) => {
      const key = groupPermissionLabel(permission.name)
      accumulator[key] ??= []
      accumulator[key].push(permission)
      return accumulator
    }, {})
  }, [permissions, search])

  const selected = useMemo(() => new Set(form.permissionNames), [form.permissionNames])

  const togglePermission = (permissionName: string) => {
    setForm((current) => ({
      ...current,
      permissionNames: selected.has(permissionName)
        ? current.permissionNames.filter((name) => name !== permissionName)
        : [...current.permissionNames, permissionName],
    }))
  }

  const handleSubmit = async () => {
    await onSubmit({
      name: form.name.trim(),
      permissionNames: form.permissionNames.slice().sort(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>
            {mode === "create" ? "Nouveau role" : "Modifier le role"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            Configurez le nom du role et les permissions associees.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="role-name">
              Nom du role
            </label>
            <Input
              id="role-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex: catalog-manager"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="role-permission-search">
              Permissions du role
            </label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="role-permission-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une permission"
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[320px] rounded-xl border border-border/70">
            <div className="space-y-4 p-4">
              {Object.entries(groupedPermissions).length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Aucune permission ne correspond a la recherche.
                </p>
              ) : (
                Object.entries(groupedPermissions)
                  .sort(([left], [right]) => left.localeCompare(right, "fr"))
                  .map(([group, items]) => (
                    <div key={group} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                          {group}
                        </p>
                        <Badge variant="outline" className="rounded-full text-[10px]">
                          {items.length}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map((permission) => {
                          const isChecked = selected.has(permission.name)

                          return (
                            <label
                              key={permission.id}
                              htmlFor={`role-permission-${permission.id}`}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 transition-colors",
                                isChecked && "border-primary/20 bg-accent/60"
                              )}
                            >
                              <Checkbox
                                id={`role-permission-${permission.id}`}
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(permission.name)}
                              />
                              <span className="font-mono text-xs font-medium">
                                {permission.name}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || form.name.trim().length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : mode === "create" ? (
              "Creer le role"
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  open,
  title,
  description,
  confirmLabel,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isDeleting: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <div className="mb-3 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
              <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-center leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Suppression...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RolesPermissionsPage() {
  const { can } = usePermissions()

  const canViewRoles = can(PERM_ROLES_VIEW) || can(PERM_ROLES_MANAGE)
  const canManageRoles = can(PERM_ROLES_MANAGE)

  const [search, setSearch] = useState("")
  const [permissionFilter, setPermissionFilter] = useState("all")
  const deferredSearch = useDeferredValue(search)

  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleDialogMode, setRoleDialogMode] = useState<"create" | "edit">("create")
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<AdminRole | null>(null)

  const {
    data: roles = [],
    error: rolesError,
    isLoading,
    isFetching,
  } = useGetRolesQuery(
    {
      search: deferredSearch.trim() || undefined,
      permission_name: permissionFilter !== "all" ? permissionFilter : undefined,
    },
    { skip: !canViewRoles }
  )

  const {
    data: allPermissions = [],
    isLoading: isLoadingPermissions,
  } = useGetPermissionsQuery(undefined, { skip: !canViewRoles })

  const [createRole, createRoleState] = useCreateRoleMutation()
  const [updateRole, updateRoleState] = useUpdateRoleMutation()
  const [deleteRole, deleteRoleState] = useDeleteRoleMutation()

  useEffect(() => {
    if (rolesError) {
      toast.error(getErrorMessage(rolesError, "Impossible de charger les roles."))
    }
  }, [rolesError])

  const permissionNames = useMemo(() => {
    const names = Array.from(new Set(allPermissions.map((permission) => permission.name)))
    return names.sort((left, right) => left.localeCompare(right, "fr"))
  }, [allPermissions])

  const columns = useMemo<ColumnDef<AdminRole>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/15 bg-primary/8 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold"
              >
                <ShieldCheck className="size-3" />
                {row.original.name}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {row.original.permissions?.length ?? row.original.permissions_count ?? 0} permission
              {(row.original.permissions?.length ?? row.original.permissions_count ?? 0) !== 1
                ? "s"
                : ""}
            </p>
          </div>
        ),
      },
      {
        id: "permissions",
        header: "Permissions",
        cell: ({ row }) => {
          const items = row.original.permissions ?? []

          if (items.length === 0) {
            return (
              <span className="text-muted-foreground text-sm">
                Aucune permission
              </span>
            )
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 3).map((permission) => (
                <Badge
                  key={permission.id}
                  variant="outline"
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium"
                >
                  {permission.name}
                </Badge>
              ))}
              {items.length > 3 ? (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                  +{items.length - 3}
                </Badge>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: "guard_name",
        header: "Guard",
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
            {row.original.guard_name ?? "web"}
          </Badge>
        ),
      },
      {
        accessorKey: "updated_at",
        header: "Maj",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RoleActionMenu
              role={row.original}
              canManage={canManageRoles}
              onEdit={(role) => {
                setSelectedRole(role)
                setRoleDialogMode("edit")
                setRoleDialogOpen(true)
              }}
              onDelete={(role) => setRoleToDelete(role)}
            />
          </div>
        ),
      },
    ],
    [canManageRoles]
  )

  const handleRoleSubmit = async (payload: RoleFormState) => {
    const result =
      roleDialogMode === "create"
        ? await createRole({
            name: payload.name,
            permission_names: payload.permissionNames,
          })
        : await updateRole({
            roleId: selectedRole?.id as RoleId,
            name: payload.name,
            permission_names: payload.permissionNames,
          })

    if ("error" in result) {
      toast.error(
        getErrorMessage(
          result.error,
          roleDialogMode === "create"
            ? "Impossible de creer le role."
            : "Impossible de mettre a jour le role."
        )
      )
      return
    }

    toast.success(roleDialogMode === "create" ? "Role cree." : "Role mis a jour.")
    setRoleDialogOpen(false)
  }

  const handleDeleteRole = async () => {
    if (!roleToDelete) {
      return
    }

    const result = await deleteRole(roleToDelete.id)

    if ("error" in result) {
      toast.error(getErrorMessage(result.error, "Impossible de supprimer le role."))
      return
    }

    toast.success("Role supprime.")
    setRoleToDelete(null)
  }

  const hasFilters = search.trim().length > 0 || permissionFilter !== "all"

  return (
    <>
      <ListPageShell
        title="Roles"
        description="Gestion des roles du back-office et des permissions associees."
        action={
          canManageRoles ? (
            <Button
              size="sm"
              className="h-9 w-full px-4 shadow-sm md:w-auto"
              onClick={() => {
                setSelectedRole(null)
                setRoleDialogMode("create")
                setRoleDialogOpen(true)
              }}
            >
              <ShieldEllipsis className="size-3.5" />
              Ajouter un role
            </Button>
          ) : null
        }
      >
        <Card className="brand-panel border-border/70">
          <CardHeader className="px-4 pt-4 pb-0 md:px-5">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="text-primary size-4" />
                Catalogue des roles
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Creez, modifiez ou supprimez des roles et leurs permissions.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pt-4 pb-4 md:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                <div className="relative w-full md:max-w-xs">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un role"
                    className="h-9 bg-background pl-9 md:w-80"
                  />
                </div>

                <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                  <SelectTrigger className="w-full md:w-72">
                    <SelectValue placeholder="Toutes les permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les permissions</SelectItem>
                    {permissionNames.map((permissionName) => (
                      <SelectItem key={permissionName} value={permissionName}>
                        {permissionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setSearch("")
                    setPermissionFilter("all")
                  }}
                  disabled={!hasFilters}
                  className="h-9"
                >
                  <RefreshCcw className="size-3.5" />
                  Reinitialiser
                </Button>
              </div>

              <Badge variant="outline" className="h-8 px-2.5 text-xs font-medium">
                {isFetching ? "Actualisation..." : `${roles.length} role${roles.length !== 1 ? "s" : ""}`}
              </Badge>
            </div>

            <DataTable
              columns={columns}
              data={roles}
              emptyMessage={
                isLoading
                  ? "Chargement des roles..."
                  : hasFilters
                    ? "Aucun role ne correspond aux filtres appliques."
                    : "Aucun role trouve."
              }
            />
          </CardContent>
        </Card>
      </ListPageShell>

      <RoleDialog
        open={roleDialogOpen}
        mode={roleDialogMode}
        role={selectedRole}
        permissions={allPermissions}
        isSaving={createRoleState.isLoading || updateRoleState.isLoading || isLoadingPermissions}
        onOpenChange={setRoleDialogOpen}
        onSubmit={handleRoleSubmit}
      />

      <DeleteDialog
        open={Boolean(roleToDelete)}
        title="Supprimer le role"
        description={
          roleToDelete
            ? `Le role ${roleToDelete.name} sera supprime de la plateforme.`
            : ""
        }
        confirmLabel="Supprimer le role"
        isDeleting={deleteRoleState.isLoading}
        onOpenChange={(open) => {
          if (!open) {
            setRoleToDelete(null)
          }
        }}
        onConfirm={handleDeleteRole}
      />
    </>
  )
}
