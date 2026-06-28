"use client"

import { useEffect, useState } from "react"
import { KeyRound, Loader2, Save, UserRound } from "lucide-react"
import { toast } from "sonner"

import { ListPageShell } from "@/components/admin/list-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentUser } from "@/store/slices/session-slice"
import {
  useGetCurrentUserQuery,
  useUpdatePasswordMutation,
  useUpdateProfileMutation,
} from "@/store/api/auth"

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const candidate = error as { data?: { message?: unknown; errors?: Record<string, string[] | string> }; error?: string }
    const firstFieldError = candidate.data?.errors
      ? Object.values(candidate.data.errors)[0]
      : undefined
    if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === "string") return firstFieldError[0]
    if (typeof firstFieldError === "string") return firstFieldError
    if (typeof candidate.data?.message === "string") return candidate.data.message
    if (typeof candidate.error === "string") return candidate.error
  }
  return fallback
}

export function ProfilePage() {
  const sessionUser = useAppSelector(selectCurrentUser)
  const { data: currentUser } = useGetCurrentUserQuery()
  const user = currentUser ?? sessionUser

  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation()
  const [updatePassword, { isLoading: isSavingPassword }] = useUpdatePasswordMutation()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cin, setCin] = useState("")
  const [jobTitle, setJobTitle] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (!user) return
    setName(user.name ?? "")
    setEmail(user.email ?? "")
    setPhone(user.phone ?? "")
    setCin(user.cin ?? "")
    setJobTitle(user.job_title ?? "")
  }, [user])

  const submitProfile = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis.")
      return
    }
    if (!email.trim()) {
      toast.error("L'email est requis.")
      return
    }

    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        cin: cin.trim() || null,
        job_title: jobTitle.trim() || null,
      }).unwrap()
      toast.success("Profil mis a jour.")
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de mettre a jour le profil."))
    }
  }

  const submitPassword = async () => {
    if (!currentPassword) {
      toast.error("Le mot de passe actuel est requis.")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caracteres.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }

    try {
      await updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }).unwrap()
      toast.success("Mot de passe mis a jour.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de mettre a jour le mot de passe."))
    }
  }

  return (
    <ListPageShell
      badge="Compte"
      title="Mon profil"
      description="Modifiez vos informations personnelles et votre mot de passe."
    >
      <div className="grid max-w-3xl gap-4">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4 text-primary" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Votre nom d&apos;utilisateur est {user?.username ?? "—"} et ne peut pas etre modifie.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="profile-name">Nom complet</label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="profile-email">Email</label>
              <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="profile-phone">Telephone</label>
              <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0612345678" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="profile-cin">CIN</label>
              <Input id="profile-cin" value={cin} onChange={(e) => setCin(e.target.value)} placeholder="AB123456" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="profile-job">Poste</label>
              <Input id="profile-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex: Manager" />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={submitProfile} disabled={isSavingProfile}>
                {isSavingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-primary" />
              Mot de passe
            </CardTitle>
            <CardDescription>
              Choisissez un mot de passe d&apos;au moins 8 caracteres.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="current-password">Mot de passe actuel</label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Mot de passe actuel" autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="new-password">Nouveau mot de passe</label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 caracteres" autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="confirm-password">Confirmer le mot de passe</label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer le mot de passe" autoComplete="new-password" />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={submitPassword} disabled={isSavingPassword}>
                {isSavingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Modifier le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ListPageShell>
  )
}
