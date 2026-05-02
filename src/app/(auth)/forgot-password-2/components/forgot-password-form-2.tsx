"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm2({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Mot de passe oublie ?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Saisissez votre adresse e-mail et nous vous enverrons un lien de reinitialisation
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <Button type="submit" className="w-full cursor-pointer">
          Envoyer le lien de reinitialisation
        </Button>
      </div>
      <div className="text-center text-sm">
        Vous vous souvenez de votre mot de passe ?{" "}
        <a href="/sign-in-2" className="underline underline-offset-4">
          Retour a la connexion
        </a>
      </div>
    </form>
  )
}
