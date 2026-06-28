"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  CircleOff,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  PowerOff,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { AdminUser } from "@/store/api/users"
import {
  useSyncUserPermissionsMutation,
  useSyncUserRolesMutation,
  useUpdateUserMutation,
} from "@/store/api/users"
import { useGetRolesQuery } from "@/store/api/roles"
import { useGetPermissionsQuery } from "@/store/api/permissions"
import { usePermissions } from "@/hooks/use-permissions"
import {
  PERM_USERS_MANAGE_ROLES,
  PERM_USERS_MANAGE_PERMISSIONS,
  PERM_USERS_DEACTIVATE,
  PERM_USERS_EDIT,
} from "@/lib/permissions"

// helpers
function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}
function formatDate(iso?: string) {
  if (!iso) return null
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso))
}
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-6 items-start justify-between gap-8">
      <span className="min-w-[80px] shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
function EmptyValue({ label }: { label: string }) {
  return <span className="text-sm italic text-muted-foreground/60">{label}</span>
}

// Toggle activation dialog
function ToggleActivationDialog({
  user, open, onOpenChange,
}: { user: AdminUser; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [updateUser, { isLoading }] = useUpdateUserMutation()
  const isActive = user.is_active

  const handleConfirm = useCallback(async () => {
    const result = await updateUser({ userId: user.id, is_active: !isActive })
    if ("error" in result) {
      toast.error(isActive ? "Impossible de desactiver ce compte." : "Impossible d'activer ce compte.")
      return
    }
    toast.success(
      isActive ? `Compte de ${user.name} desactive.` : `Compte de ${user.name} active.`,
      { description: isActive ? "Cet utilisateur ne peut plus se connecter." : "Cet utilisateur peut de nouveau se connecter." }
    )
    onOpenChange(false)
  }, [updateUser, user, isActive, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[400px]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="mb-3 flex items-center justify-center">
            <div className={cn("flex size-12 items-center justify-center rounded-full", isActive ? "bg-rose-100 dark:bg-rose-950/50" : "bg-emerald-100 dark:bg-emerald-950/50")}>
              {isActive ? <PowerOff className="size-5 text-rose-600 dark:text-rose-400" /> : <Zap className="size-5 text-emerald-600 dark:text-emerald-400" />}
            </div>
          </div>
          <DialogTitle className="text-center">{isActive ? "Desactiver le compte" : "Activer le compte"}</DialogTitle>
          <DialogDescription className="mt-1 text-center text-sm leading-relaxed">
            {isActive ? <>Le compte de <span className="font-medium text-foreground">{user.name}</span> sera bloque. Il ne pourra plus se connecter au back-office.</> : <>Le compte de <span className="font-medium text-foreground">{user.name}</span> sera reactive. Il pourra de nouveau acceder au back-office.</>}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t border-border/70 px-6 py-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">Annuler</Button>
          <Button size="sm" onClick={handleConfirm} disabled={isLoading} className={cn("flex-1", isActive ? "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600" : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600")}>
            {isLoading ? <><Loader2 className="size-4 animate-spin" />{isActive ? "Desactivation..." : "Activation..."}</> : isActive ? <><PowerOff className="size-4" />Desactiver</> : <><Zap className="size-4" />Activer</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserEditDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [updateUser, { isLoading }] = useUpdateUserMutation()
  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone ?? "",
    cin: user.cin ?? "",
    job_title: user.job_title ?? "",
    password: "",
    password_confirmation: "",
    is_active: user.is_active,
  })

  useEffect(() => {
    if (!open) return

    setForm({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone ?? "",
      cin: user.cin ?? "",
      job_title: user.job_title ?? "",
      password: "",
      password_confirmation: "",
      is_active: user.is_active,
    })
  }, [open, user])

  const handleSave = useCallback(async () => {
    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      cin: form.cin.trim() || null,
      job_title: form.job_title.trim() || null,
      is_active: form.is_active,
      ...(form.password
        ? {
            password: form.password,
            password_confirmation: form.password_confirmation,
          }
        : {}),
    }

    const result = await updateUser({ userId: user.id, ...payload })

    if ("error" in result) {
      toast.error("Impossible de modifier cet utilisateur.")
      return
    }

    toast.success("Utilisateur modifie.", {
      description: `${payload.name} a ete mis a jour.`,
    })
    onOpenChange(false)
  }, [form, onOpenChange, updateUser, user.id])

  const isInvalid =
    form.name.trim().length === 0 ||
    form.username.trim().length === 0 ||
    form.email.trim().length === 0 ||
    (form.password.length > 0 &&
      (form.password.length < 8 || form.password !== form.password_confirmation))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[620px]">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          <DialogDescription className="mt-1 leading-relaxed">
            Mettez a jour les informations du compte {user.name}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-name-${user.id}`}>
                Nom complet
              </label>
              <Input
                id={`edit-user-name-${user.id}`}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-username-${user.id}`}>
                Username
              </label>
              <Input
                id={`edit-user-username-${user.id}`}
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-email-${user.id}`}>
                E-mail
              </label>
              <Input
                id={`edit-user-email-${user.id}`}
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-phone-${user.id}`}>
                Telephone
              </label>
              <Input
                id={`edit-user-phone-${user.id}`}
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-cin-${user.id}`}>
                CIN
              </label>
              <Input
                id={`edit-user-cin-${user.id}`}
                value={form.cin}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cin: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-job-${user.id}`}>
                Fonction
              </label>
              <Input
                id={`edit-user-job-${user.id}`}
                value={form.job_title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, job_title: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-password-${user.id}`}>
                Nouveau mot de passe
              </label>
              <Input
                id={`edit-user-password-${user.id}`}
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Laisser vide pour conserver"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`edit-user-confirm-${user.id}`}>
                Confirmation
              </label>
              <Input
                id={`edit-user-confirm-${user.id}`}
                type="password"
                value={form.password_confirmation}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password_confirmation: event.target.value,
                  }))
                }
                placeholder="Confirmer si modifie"
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 md:col-span-2">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, is_active: checked === true }))
                }
              />
              <div>
                <p className="text-sm font-medium">Compte actif</p>
                <p className="text-xs text-muted-foreground">
                  L&apos;utilisateur peut acceder au back-office.
                </p>
              </div>
            </label>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isInvalid}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Detail Sheet
function UserDetailSheet({
  user, open, onOpenChange, onEditRoles, onEditPermissions, onToggleActivation,
}: { user: AdminUser; open: boolean; onOpenChange: (v: boolean) => void; onEditRoles: () => void; onEditPermissions: () => void; onToggleActivation: () => void }) {
  const { can } = usePermissions()
  const createdAt = formatDate(user.created_at)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[420px]">
        <SheetHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <div className="flex items-start gap-3.5">
            <Avatar className="size-12 shrink-0 border border-border/70">
              <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-base leading-snug">{user.name}</SheetTitle>
                {user.is_active
                  ? <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-2 py-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-2.5" />Actif</Badge>
                  : <Badge variant="outline" className="rounded-full border-rose-500/20 bg-rose-500/10 px-2 py-0 text-[10px] font-semibold text-rose-700 dark:text-rose-300"><CircleOff className="size-2.5" />Inactif</Badge>}
              </div>
              <SheetDescription className="mt-0.5 text-xs leading-none">{user.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-6 py-5">
            <SectionBlock title="Informations">
              <FieldRow label="Fonction">{user.job_title ? <span className="text-sm">{user.job_title}</span> : <EmptyValue label="Non renseignee" />}</FieldRow>
              <FieldRow label="Telephone">{user.phone ? <span className="text-sm">{user.phone}</span> : <EmptyValue label="Non renseigne" />}</FieldRow>
              <FieldRow label="CIN">{user.cin ? <span className="font-mono text-sm">{user.cin}</span> : <EmptyValue label="Non renseigne" />}</FieldRow>
              {createdAt && <FieldRow label="Membre depuis"><span className="text-sm text-muted-foreground">{createdAt}</span></FieldRow>}
            </SectionBlock>
            <Separator className="opacity-50" />
            <SectionBlock title={`Roles (${user.roles.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.length === 0
                  ? <p className="text-sm italic text-muted-foreground">Aucun role attribue</p>
                  : user.roles.map((role) => <Badge key={role.id} variant="outline" className="rounded-full px-2.5 py-1 text-[11px] font-medium"><ShieldCheck className="size-3 text-primary" />{role.name}</Badge>)}
              </div>
              {can(PERM_USERS_MANAGE_ROLES) && (
                <Button variant="outline" size="sm" className="mt-1 h-8 cursor-pointer gap-1.5 text-xs" onClick={() => { onOpenChange(false); onEditRoles() }}><ShieldCheck className="size-3.5" />Modifier les roles</Button>
              )}
            </SectionBlock>
            <Separator className="opacity-50" />
            <SectionBlock title={`Permissions directes (${user.permissions.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.length === 0
                  ? <p className="text-sm italic text-muted-foreground">Aucune permission directe</p>
                  : user.permissions.map((perm) => <Badge key={perm.id} variant="outline" className="rounded-full px-2.5 py-1 font-mono text-[11px] font-medium">{perm.name}</Badge>)}
              </div>
              {can(PERM_USERS_MANAGE_PERMISSIONS) && (
                <Button variant="outline" size="sm" className="mt-1 h-8 cursor-pointer gap-1.5 text-xs" onClick={() => { onOpenChange(false); onEditPermissions() }}><KeyRound className="size-3.5" />Modifier les permissions</Button>
              )}
            </SectionBlock>
            {can(PERM_USERS_DEACTIVATE) && (
              <>
                <Separator className="opacity-50" />
                <SectionBlock title="Zone d'administration">
              <div className={cn("rounded-xl border p-4", user.is_active ? "border-rose-200/60 bg-rose-50/50 dark:border-rose-800/40 dark:bg-rose-950/20" : "border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20")}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={cn("mt-0.5 size-4 shrink-0", user.is_active ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")} />
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", user.is_active ? "text-rose-800 dark:text-rose-200" : "text-emerald-800 dark:text-emerald-200")}>{user.is_active ? "Desactiver l'acces" : "Reactiver l'acces"}</p>
                    <p className={cn("mt-0.5 text-xs leading-relaxed", user.is_active ? "text-rose-700/80 dark:text-rose-300/80" : "text-emerald-700/80 dark:text-emerald-300/80")}>{user.is_active ? "Bloque la connexion sans supprimer le compte ni les donnees." : "Autorise de nouveau cet utilisateur a se connecter au back-office."}</p>
                    <Button size="sm" className={cn("mt-3 h-8 cursor-pointer gap-1.5 text-xs", user.is_active ? "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600" : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600")} onClick={() => { onOpenChange(false); onToggleActivation() }}>
                      {user.is_active ? <><PowerOff className="size-3.5" />Desactiver le compte</> : <><Zap className="size-3.5" />Reactiver le compte</>}
                    </Button>
                  </div>
                </div>
              </div>
            </SectionBlock>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// Roles Dialog
function UserRolesDialog({ user, open, onOpenChange }: { user: AdminUser; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: availableRoles = [], isLoading: isLoadingRoles } = useGetRolesQuery(undefined, { skip: !open })
  const [syncUserRoles, { isLoading: isSaving }] = useSyncUserRolesMutation()
  const [selected, setSelected] = useState<Set<string>>(new Set(user.roles.map((r) => r.name)))
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) return
    setSelected(new Set(user.roles.map((r) => r.name)))
    setSearch("")
  }, [open, user.roles])

  const filtered = useMemo(() => availableRoles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())), [availableRoles, search])
  const currentNames = useMemo(() => user.roles.map((r) => r.name), [user.roles])
  const hasChanges = useMemo(() => {
    const current = new Set(currentNames)
    if (selected.size !== current.size) return true
    for (const name of selected) { if (!current.has(name)) return true }
    return false
  }, [selected, currentNames])

  const toggle = useCallback((name: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next })
  }, [])

  const handleSave = useCallback(async () => {
    const roleNames = Array.from(selected)
    const result = await syncUserRoles({ userId: user.id, role_names: roleNames })
    if ("error" in result) { toast.error("Impossible de mettre a jour les roles. Reessayez."); return }
    toast.success("Roles mis a jour.", { description: roleNames.length > 0 ? `${roleNames.length} role${roleNames.length > 1 ? "s" : ""} attribue${roleNames.length > 1 ? "s" : ""} a ${user.name}.` : `Tous les roles retires de ${user.name}.` })
    onOpenChange(false)
  }, [selected, syncUserRoles, user, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[460px]">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>Gerer les roles</DialogTitle>
          <DialogDescription className="mt-1 leading-relaxed">Roles attribues a <span className="font-medium text-foreground">{user.name}</span>. Les roles decoches seront retires.</DialogDescription>
        </DialogHeader>
        <div className="border-b border-border/50 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un role..." className="h-9 bg-background pl-9" disabled={isLoadingRoles} />
          </div>
        </div>
        <ScrollArea className="max-h-[280px]">
          <div className="px-2 py-2">
            {isLoadingRoles ? (
              <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement...</div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{search.trim() ? "Aucun role ne correspond a la recherche." : "Aucun role disponible."}</p>
            ) : (
              <ul>
                {filtered.map((role) => {
                  const isChecked = selected.has(role.name)
                  const permCount = role.permissions?.length ?? role.permissions_count ?? 0
                  return (
                    <li key={role.id}>
                      <label htmlFor={`role-${role.id}`} className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60", isChecked && "bg-accent/40")}>
                        <Checkbox id={`role-${role.id}`} checked={isChecked} onCheckedChange={() => toggle(role.name)} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className={cn("size-3.5 shrink-0", isChecked ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("truncate text-sm font-medium", !isChecked && "text-muted-foreground")}>{role.name}</span>
                          </div>
                          {permCount > 0 && <p className="mt-0.5 text-xs text-muted-foreground/70">{permCount} permission{permCount > 1 ? "s" : ""}</p>}
                        </div>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="flex-row items-center gap-2 border-t border-border/70 px-5 py-3.5">
          <span className="flex-1 text-xs text-muted-foreground">{selected.size} role{selected.size !== 1 ? "s" : ""} selectionne{selected.size !== 1 ? "s" : ""}</span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || isLoadingRoles || !hasChanges}>{isSaving ? <><Loader2 className="size-4 animate-spin" />Enregistrement...</> : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Permissions Dialog with inherited display
function UserPermissionsDialog({ user, open, onOpenChange }: { user: AdminUser; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: availablePermissions = [], isLoading: isLoadingPermissions } = useGetPermissionsQuery(undefined, { skip: !open })
  const { data: allRoles = [], isLoading: isLoadingRoles } = useGetRolesQuery(undefined, { skip: !open })
  const isLoading = isLoadingPermissions || isLoadingRoles

  const [syncUserPermissions, { isLoading: isSaving }] = useSyncUserPermissionsMutation()
  const directNames = useMemo(() => user.permissions.map((p) => p.name), [user.permissions])

  // Build map: permName -> roleNames[] for inherited permissions
  const inheritedMap = useMemo(() => {
    const userRoleNames = new Set(user.roles.map((r) => r.name))
    const map = new Map<string, string[]>()
    for (const role of allRoles) {
      if (!userRoleNames.has(role.name)) continue
      for (const perm of role.permissions ?? []) {
        const existing = map.get(perm.name) ?? []
        existing.push(role.name)
        map.set(perm.name, existing)
      }
    }
    return map
  }, [allRoles, user.roles])

  const [selected, setSelected] = useState<Set<string>>(new Set(directNames))
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) return
    setSelected(new Set(directNames))
    setSearch("")
  }, [open, directNames])

  const filtered = useMemo(() => availablePermissions.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [availablePermissions, search])
  const hasChanges = useMemo(() => {
    const current = new Set(directNames)
    if (selected.size !== current.size) return true
    for (const name of selected) { if (!current.has(name)) return true }
    return false
  }, [selected, directNames])

  const toggle = useCallback((name: string) => {
    if (inheritedMap.has(name)) return
    setSelected((prev) => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next })
  }, [inheritedMap])

  const handleSave = useCallback(async () => {
    const permNames = Array.from(selected)
    const result = await syncUserPermissions({ userId: user.id, permission_names: permNames })
    if ("error" in result) { toast.error("Impossible de mettre a jour les permissions. Reessayez."); return }
    toast.success("Permissions mises a jour.", { description: permNames.length > 0 ? `${permNames.length} permission${permNames.length > 1 ? "s" : ""} directe${permNames.length > 1 ? "s" : ""} attribuee${permNames.length > 1 ? "s" : ""} a ${user.name}.` : `Toutes les permissions directes retirees de ${user.name}.` })
    onOpenChange(false)
  }, [selected, syncUserPermissions, user, onOpenChange])

  const inheritedCount = inheritedMap.size
  const directSelectedCount = Array.from(selected).filter((n) => !inheritedMap.has(n)).length

  return (
    <TooltipProvider delayDuration={200}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[480px]">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Gerer les permissions</DialogTitle>
            <DialogDescription className="mt-1 leading-relaxed">Permissions directes de <span className="font-medium text-foreground">{user.name}</span>.</DialogDescription>
          </DialogHeader>
          {inheritedCount > 0 && (
            <div className="flex items-center gap-4 border-b border-border/40 bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="size-3 text-primary/60" />Heritee d&apos;un role (non modifiable)</span>
              <span className="flex items-center gap-1.5"><KeyRound className="size-3 text-primary" />Permission directe</span>
            </div>
          )}
          <div className="border-b border-border/50 px-5 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une permission..." className="h-9 bg-background pl-9" disabled={isLoading} />
            </div>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="px-2 py-2">
              {isLoading ? (
                <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement...</div>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{search.trim() ? "Aucune permission ne correspond a la recherche." : "Aucune permission disponible."}</p>
              ) : (
                <ul>
                  {filtered.map((perm) => {
                    const isInherited = inheritedMap.has(perm.name)
                    const inheritedFrom = inheritedMap.get(perm.name) ?? []
                    const isChecked = isInherited || selected.has(perm.name)
                    return (
                      <li key={perm.id}>
                        <div
                          className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors", isInherited ? "opacity-70" : "cursor-pointer hover:bg-accent/60", isChecked && !isInherited && "bg-accent/40")}
                          onClick={() => toggle(perm.name)}
                          role={isInherited ? undefined : "button"}
                          tabIndex={isInherited ? undefined : 0}
                          onKeyDown={(e) => { if (!isInherited && (e.key === " " || e.key === "Enter")) { e.preventDefault(); toggle(perm.name) } }}
                        >
                          {isInherited ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex shrink-0 size-4 items-center justify-center rounded border border-primary/30 bg-primary/10">
                                  <Lock className="size-2.5 text-primary/60" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[200px] text-xs">
                                Heritee {inheritedFrom.length === 1 ? "du role" : "des roles"} <span className="font-medium">{inheritedFrom.join(", ")}</span>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Checkbox id={`perm-${perm.id}`} checked={isChecked} onCheckedChange={() => toggle(perm.name)} className="shrink-0" onClick={(e) => e.stopPropagation()} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {isInherited ? <Lock className="size-3 shrink-0 text-primary/50" /> : <KeyRound className={cn("size-3.5 shrink-0", isChecked ? "text-primary" : "text-muted-foreground")} />}
                              <span className={cn("truncate font-mono text-xs font-medium", isInherited ? "text-muted-foreground" : isChecked ? "text-foreground" : "text-muted-foreground")}>{perm.name}</span>
                            </div>
                            {isInherited && inheritedFrom.length > 0 && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground/60">Via {inheritedFrom.join(", ")}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="flex-row items-center gap-2 border-t border-border/70 px-5 py-3.5">
            <span className="flex-1 text-xs text-muted-foreground">
              {directSelectedCount} directe{directSelectedCount !== 1 ? "s" : ""}
              {inheritedCount > 0 && <span className="ml-1 opacity-60">+ {inheritedCount} heritee{inheritedCount !== 1 ? "s" : ""}</span>}
            </span>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading || !hasChanges}>{isSaving ? <><Loader2 className="size-4 animate-spin" />Enregistrement...</> : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

// Main export
export function UserDropdown({ user }: { user: AdminUser }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [rolesOpen, setRolesOpen] = useState(false)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const [toggleActivationOpen, setToggleActivationOpen] = useState(false)
  const { can } = usePermissions()

  const canManageRoles = can(PERM_USERS_MANAGE_ROLES)
  const canManagePermissions = can(PERM_USERS_MANAGE_PERMISSIONS)
  const canDeactivate = can(PERM_USERS_DEACTIVATE)
  const canEdit = can(PERM_USERS_EDIT)
  const canManageAny = canEdit || canManageRoles || canManagePermissions || canDeactivate

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" type="button" className="data-[state=open]:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-8 cursor-pointer p-0" aria-label={`Actions pour ${user.name}`}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl">
          <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-normal text-muted-foreground">{user.name}</DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => setDetailOpen(true)}>
            <Eye className="size-4 text-muted-foreground" />Voir le detail
          </DropdownMenuItem>
          {canManageAny && (
            <>
              <DropdownMenuSeparator />
              {(canManageRoles || canManagePermissions) && (
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-normal text-muted-foreground">Acces</DropdownMenuLabel>
              )}
              {canManageRoles && (
                <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => setRolesOpen(true)}>
                  <ShieldCheck className="size-4 text-muted-foreground" />Gerer les roles
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => setEditOpen(true)}>
                  <Pencil className="size-4 text-muted-foreground" />Modifier l&apos;utilisateur
                </DropdownMenuItem>
              )}
              {canManagePermissions && (
                <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => setPermissionsOpen(true)}>
                  <KeyRound className="size-4 text-muted-foreground" />Gerer les permissions
                </DropdownMenuItem>
              )}
              {canDeactivate && (
                <>
                  {(canManageRoles || canManagePermissions) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className={cn("cursor-pointer gap-2", user.is_active ? "text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-950/40" : "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 dark:focus:bg-emerald-950/40")}
                    onSelect={() => setToggleActivationOpen(true)}
                  >
                    {user.is_active ? <><PowerOff className="size-4" />Desactiver le compte</> : <><Zap className="size-4" />Reactiver le compte</>}
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserDetailSheet user={user} open={detailOpen} onOpenChange={setDetailOpen} onEditRoles={() => setRolesOpen(true)} onEditPermissions={() => setPermissionsOpen(true)} onToggleActivation={() => setToggleActivationOpen(true)} />
      <UserEditDialog user={user} open={editOpen} onOpenChange={setEditOpen} />
      <UserRolesDialog user={user} open={rolesOpen} onOpenChange={setRolesOpen} />
      <UserPermissionsDialog user={user} open={permissionsOpen} onOpenChange={setPermissionsOpen} />
      <ToggleActivationDialog user={user} open={toggleActivationOpen} onOpenChange={setToggleActivationOpen} />
    </>
  )
}
