"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Briefcase,
  CircleCheck,
  CircleOff,
  LifeBuoy,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCog,
  UserPlus,
  Users2,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  PERM_USERS_CREATE,
  PERM_USERS_DELETE,
} from "@/lib/permissions"
import { PermissionGate } from "@/components/auth/permission-gate"
import { DataTable } from "@/components/admin/data-table"
import { ListPageShell } from "@/components/admin/list-page-shell"
import { UserDropdown } from "@/components/admin/users/user-dropdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import type { AdminUser } from "@/store/api/users"
import {
  useBulkDeleteUsersMutation,
  useCreateUserMutation,
  useGetUsersQuery,
} from "@/store/api/users"
import { useGetRolesQuery } from "@/store/api/roles"

type ActivityFilter = "all" | "active" | "inactive"

const statusOptions: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
]

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getRoleMeta(roleName: string): { icon: LucideIcon; className: string } {
  const normalizedRole = roleName.toLowerCase()

  if (normalizedRole.includes("admin")) {
    return {
      icon: ShieldCheck,
      className:
        "border-primary/15 bg-primary/8 text-primary dark:border-primary/25 dark:bg-primary/12",
    }
  }

  if (normalizedRole.includes("manager")) {
    return {
      icon: Briefcase,
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    }
  }

  if (normalizedRole.includes("commerc") || normalizedRole.includes("sales")) {
    return {
      icon: TrendingUp,
      className:
        "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    }
  }

  if (normalizedRole.includes("support")) {
    return {
      icon: LifeBuoy,
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    }
  }

  return {
    icon: UserCog,
    className:
      "border-border bg-muted text-muted-foreground dark:border-border/80 dark:bg-muted/60",
  }
}

function getStatusMeta(isActive: boolean) {
  if (isActive) {
    return {
      label: "Actif",
      icon: CircleCheck,
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    }
  }

  return {
    label: "Inactif",
    icon: CircleOff,
    className:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  }
}

function getPrimaryRole(user: AdminUser) {
  return user.roles[0]?.name ?? "Sans role"
}

function getContactSummary(user: AdminUser) {
  if (user.phone && user.cin) {
    return `${user.phone} • CIN ${user.cin}`
  }

  if (user.phone) {
    return user.phone
  }

  if (user.cin) {
    return `CIN ${user.cin}`
  }

  return "Non renseigne"
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as {
      data?: unknown
      error?: string
    }

    if (
      candidate.data &&
      typeof candidate.data === "object" &&
      "message" in candidate.data &&
      typeof (candidate.data as { message?: unknown }).message === "string"
    ) {
      return (candidate.data as { message: string }).message
    }

    if (typeof candidate.error === "string") {
      return candidate.error
    }
  }

  return "Impossible de charger les utilisateurs pour le moment."
}

type UsersTableColumnsOptions = {
  selectedUserIds: string[]
  onToggleAll: (checked: boolean) => void
  onToggleOne: (userId: string, checked: boolean) => void
}

function getUsersColumns({
  selectedUserIds,
  onToggleAll,
  onToggleOne,
}: UsersTableColumnsOptions): ColumnDef<AdminUser>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const rows = table.options.data
        const allSelected = rows.length > 0 && rows.every((user) => selectedUserIds.includes(String(user.id)))
        const someSelected = rows.some((user) => selectedUserIds.includes(String(user.id)))

        return (
          <div className="flex items-center">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(checked) => onToggleAll(checked === true)}
              aria-label="Selectionner tous les utilisateurs"
            />
          </div>
        )
      },
      cell: ({ row }) => {
        const userId = String(row.original.id)
        const isSelected = selectedUserIds.includes(userId)

        return (
          <div className="flex items-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggleOne(userId, checked === true)}
              aria-label={`Selectionner ${row.original.name}`}
            />
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
    accessorKey: "name",
    header: "Utilisateur",
    cell: ({ row }) => {
      const user = row.original
      const primaryRole = getPrimaryRole(user)
      const primaryRoleMeta = getRoleMeta(primaryRole)
      const PrimaryRoleIcon = primaryRoleMeta.icon
      const extraRoles = Math.max(user.roles.length - 1, 0)

      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="border-border/70 size-9 border">
            <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium tracking-tight">{user.name}</p>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  primaryRoleMeta.className
                )}
              >
                <PrimaryRoleIcon className="size-3" />
                {primaryRole}
              </Badge>
              {extraRoles > 0 ? (
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                >
                  +{extraRoles}
                </Badge>
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">{user.email}</span>
              <span className="bg-border size-1 rounded-full" />
              <span className="text-muted-foreground">{getContactSummary(user)}</span>
            </div>
          </div>
        </div>
      )
    },
    },
    {
    accessorKey: "job_title",
    header: "Fonction",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.job_title ?? "Non renseignee"}
      </span>
    ),
    },
    {
    id: "roles",
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.original.roles

      if (roles.length === 0) {
        return (
          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
            Sans role
          </Badge>
        )
      }

      return (
        <div className="flex flex-wrap gap-1.5">
          {roles.slice(0, 2).map((role) => {
            const roleMeta = getRoleMeta(role.name)
            const RoleIcon = roleMeta.icon

            return (
              <Badge
                key={role.id}
                variant="outline"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  roleMeta.className
                )}
              >
                <RoleIcon className="size-3" />
                {role.name}
              </Badge>
            )
          })}
          {roles.length > 2 ? (
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            >
              +{roles.length - 2}
            </Badge>
          ) : null}
        </div>
      )
    },
    },
    {
    accessorKey: "is_active",
    header: "Statut",
    cell: ({ row }) => {
      const statusMeta = getStatusMeta(row.original.is_active)
      const StatusIcon = statusMeta.icon

      return (
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            statusMeta.className
          )}
        >
          <StatusIcon className="size-3" />
          {statusMeta.label}
        </Badge>
      )
    },
    },
    {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <UserDropdown user={row.original} />
      </div>
    ),
    },
  ]
}

type CreateUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { data: availableRoles = [], isLoading: isLoadingRoles } = useGetRolesQuery(undefined, {
    skip: !open,
  })
  const [createUser, { isLoading: isSaving }] = useCreateUserMutation()
  const [roleSearch, setRoleSearch] = useState("")
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    cin: "",
    job_title: "",
    is_active: true,
  })
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  useEffect(() => {
    if (!open) {
      return
    }

    setForm({
      name: "",
      username: "",
      email: "",
      password: "",
      password_confirmation: "",
      phone: "",
      cin: "",
      job_title: "",
      is_active: true,
    })
    setSelectedRoles([])
    setRoleSearch("")
  }, [open])

  const filteredRoles = useMemo(
    () =>
      availableRoles.filter((role) =>
        role.name.toLowerCase().includes(roleSearch.trim().toLowerCase())
      ),
    [availableRoles, roleSearch]
  )

  const toggleRole = (roleName: string) => {
    setSelectedRoles((current) =>
      current.includes(roleName)
        ? current.filter((name) => name !== roleName)
        : [...current, roleName]
    )
  }

  const handleSubmit = async () => {
    const result = await createUser({
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
      phone: form.phone.trim() || null,
      cin: form.cin.trim() || null,
      job_title: form.job_title.trim() || null,
      is_active: form.is_active,
      role_names: selectedRoles,
    })

    if ("error" in result) {
      toast.error(getErrorMessage(result.error))
      return
    }

    toast.success("Utilisateur cree.", {
      description: `${form.name.trim()} a ete ajoute avec succes.`,
    })
    onOpenChange(false)
  }

  const isInvalid =
    form.name.trim().length === 0 ||
    form.username.trim().length === 0 ||
    form.email.trim().length === 0 ||
    form.password.length < 8 ||
    form.password_confirmation.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[680px]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
          <DialogDescription className="mt-1">
            Creez un compte staff/admin avec selection multiple des roles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-user-name">
                  Nom complet
                </label>
                <Input
                  id="create-user-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ex: Admin Principal"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-user-username">
                  Username
                </label>
                <Input
                  id="create-user-username"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="Ex: admin.principal"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="create-user-email">
                  E-mail
                </label>
                <Input
                  id="create-user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-user-password">
                  Mot de passe
                </label>
                <Input
                  id="create-user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Minimum 8 caracteres"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-user-password-confirmation">
                  Confirmation
                </label>
                <Input
                  id="create-user-password-confirmation"
                  type="password"
                  value={form.password_confirmation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password_confirmation: event.target.value,
                    }))
                  }
                  placeholder="Confirmer le mot de passe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-user-phone">
                  Telephone
                </label>
                <Input
                  id="create-user-phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="+212612345678"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-user-cin">
                  CIN
                </label>
                <Input
                  id="create-user-cin"
                  value={form.cin}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cin: event.target.value }))
                  }
                  placeholder="AB123456"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="create-user-job-title">
                  Fonction
                </label>
                <Input
                  id="create-user-job-title"
                  value={form.job_title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, job_title: event.target.value }))
                  }
                  placeholder="Ex: Manager"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, is_active: checked === true }))
                }
              />
              <div>
                <p className="text-sm font-medium">Compte actif</p>
                <p className="text-muted-foreground text-xs">
                  L&apos;utilisateur pourra se connecter immediatement.
                </p>
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="create-user-role-search">
                Roles
              </label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="create-user-role-search"
                  value={roleSearch}
                  onChange={(event) => setRoleSearch(event.target.value)}
                  placeholder="Rechercher un role"
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="h-[320px] rounded-xl border border-border/70">
              <div className="space-y-2 p-3">
                {isLoadingRoles ? (
                  <div className="text-muted-foreground flex h-24 items-center justify-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Chargement...
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    Aucun role ne correspond a la recherche.
                  </p>
                ) : (
                  filteredRoles.map((role) => {
                    const isChecked = selectedRoles.includes(role.name)
                    const permCount = role.permissions?.length ?? role.permissions_count ?? 0

                    return (
                      <label
                        key={role.id}
                        htmlFor={`create-role-${role.id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 transition-colors",
                          isChecked && "border-primary/20 bg-accent/60"
                        )}
                      >
                        <Checkbox
                          id={`create-role-${role.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleRole(role.name)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <ShieldCheck
                              className={cn(
                                "size-3.5 shrink-0",
                                isChecked ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                            <span className="truncate text-sm font-medium">{role.name}</span>
                          </div>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {permCount} permission{permCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
              {selectedRoles.length} role{selectedRoles.length !== 1 ? "s" : ""} selectionne{selectedRoles.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isInvalid}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creation...
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                Creer l&apos;utilisateur
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BulkDeleteUsersDialog({
  open,
  selectedCount,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  selectedCount: number
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <div className="mb-3 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
              <CircleOff className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <DialogTitle className="text-center">Supprimer les utilisateurs</DialogTitle>
          <DialogDescription className="mt-1 text-center leading-relaxed">
            {selectedCount} utilisateur{selectedCount !== 1 ? "s" : ""} seront supprime
            {selectedCount !== 1 ? "s" : ""} definitivement.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting || selectedCount === 0}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Confirmer la suppression"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<ActivityFilter>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  const {
    data: users = [],
    error,
    isLoading,
    isFetching,
  } = useGetUsersQuery({
    search: searchTerm.trim() || undefined,
    role_name: roleFilter !== "all" ? roleFilter : undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active",
  })
  const [bulkDeleteUsers, { isLoading: isDeletingUsers }] = useBulkDeleteUsersMutation()

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error))
    }
  }, [error])

  useEffect(() => {
    setSelectedUserIds((current) => {
      const next = current.filter((userId) =>
        users.some((user) => String(user.id) === userId)
      )

      if (next.length === current.length && next.every((userId, index) => userId === current[index])) {
        return current
      }

      return next
    })
  }, [users])

  const roleNames = Array.from(
    new Set(
      users
        .flatMap((user) => user.roles.map((role) => role.name))
        .filter((roleName): roleName is string => roleName.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right, "fr"))

  if (roleFilter !== "all" && !roleNames.includes(roleFilter)) {
    roleNames.unshift(roleFilter)
  }

  const roleOptions = [
    { value: "all", label: "Tous les roles" },
    ...roleNames.map((roleName) => ({
      value: roleName,
      label: roleName,
    })),
  ]

  const activeCount = users.filter((user) => user.is_active).length
  const inactiveCount = users.length - activeCount
  const selectedCount = selectedUserIds.length
  const hasFilters =
    searchTerm.trim().length > 0 || roleFilter !== "all" || statusFilter !== "all"

  const toggleAllUsers = (checked: boolean) => {
    setSelectedUserIds(checked ? users.map((user) => String(user.id)) : [])
  }

  const toggleUser = (userId: string, checked: boolean) => {
    setSelectedUserIds((current) =>
      checked
        ? Array.from(new Set([...current, userId]))
        : current.filter((value) => value !== userId)
    )
  }

  const columns = useMemo(
    () =>
      getUsersColumns({
        selectedUserIds,
        onToggleAll: toggleAllUsers,
        onToggleOne: toggleUser,
      }),
    [selectedUserIds, users]
  )

  const resetFilters = () => {
    setSearchTerm("")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  const handleBulkDelete = async () => {
    const result = await bulkDeleteUsers({
      user_ids: selectedUserIds,
    })

    if ("error" in result) {
      toast.error(getErrorMessage(result.error))
      return
    }

    toast.success("Utilisateurs supprimes.", {
      description: `${selectedCount} utilisateur${selectedCount !== 1 ? "s" : ""} ont ete supprimes.`,
    })
    setSelectedUserIds([])
    setBulkDeleteOpen(false)
  }

  return (
    <ListPageShell
      title="Utilisateurs"
      description="Gestion des comptes du personnel et des administrateurs. Filtrez par role, par statut ou par recherche libre."
      action={
        <PermissionGate permission={PERM_USERS_CREATE}>
          <Button
            size="sm"
            className="h-9 w-full px-4 shadow-sm md:w-auto"
            type="button"
            onClick={() => setCreateDialogOpen(true)}
          >
            <UserPlus className="size-3.5" />
            Ajouter un utilisateur
          </Button>
        </PermissionGate>
      }
    >
      <Card className="brand-panel border-border/70">
        <CardHeader className="px-4 pt-4 pb-0 md:px-5">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users2 className="text-primary size-4" />
              Liste des utilisateurs
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Donnees chargees depuis le serveur et actualisees en temps reel.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pt-4 pb-4 md:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <div className="relative w-full md:max-w-xs">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par nom, e-mail, telephone, CIN ou poste"
                  className="h-9 bg-background pl-9 md:w-80"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Tous les roles" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ActivityFilter)}
              >
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
                className="h-9"
              >
                <RefreshCcw className="size-3.5" />
                Reinitialiser
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {selectedCount > 0 ? (
                <PermissionGate permission={PERM_USERS_DELETE}>
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="h-8"
                  >
                    Supprimer ({selectedCount})
                  </Button>
                </PermissionGate>
              ) : null}
              <Badge variant="outline" className="h-8 px-2.5 text-xs font-medium">
                {isFetching ? "Actualisation..." : `${users.length} resultat${users.length !== 1 ? "s" : ""}`}
              </Badge>
              <Badge
                variant="outline"
                className="h-8 border-emerald-500/20 bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              >
                <CircleCheck className="size-3.5" />
                {activeCount} actifs
              </Badge>
              <Badge
                variant="outline"
                className="h-8 border-rose-500/20 bg-rose-500/10 px-2.5 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                <CircleOff className="size-3.5" />
                {inactiveCount} inactifs
              </Badge>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={users}
            emptyMessage={
              isLoading
                ? "Chargement des utilisateurs..."
                : hasFilters
                  ? "Aucun utilisateur ne correspond aux filtres appliques."
                  : "Aucun utilisateur trouve."
            }
          />
        </CardContent>
      </Card>

      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <BulkDeleteUsersDialog
        open={bulkDeleteOpen}
        selectedCount={selectedCount}
        isDeleting={isDeletingUsers}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
      />
    </ListPageShell>
  )
}
