"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { signInAction } from "@/actions/auth-actions"
import { loginFormSchema, type LoginFormValues } from "@/lib/validation"

export function LoginForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = React.useCallback(
    (values: LoginFormValues) => {
      startTransition(async () => {
        const result = await signInAction(values)

        if (result.status === "error") {
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, message]) => {
              form.setError(field as keyof LoginFormValues, {
                type: "server",
                message,
              })
            })
          }

          toast.error(result.message ?? "Connexion impossible.")
          return
        }

        form.reset({
          username: values.username,
          password: "",
        })

        toast.success(`Bienvenue, ${result.user?.name ?? "Administrateur"} !`, {
          description: "Connexion reussie. Redirection en cours...",
          duration: 3500,
        })

        router.replace("/dashboard")
      })
    },
    [form, router]
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" className="flex flex-col items-center gap-3">
          <div className="brand-badge text-foreground flex size-16 items-center justify-center rounded-2xl">
            <Logo size={30} />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">smartLocation</p>
            <p className="text-sm font-medium text-primary">Administration location</p>
          </div>
        </Link>
      </div>
      <Card className="brand-panel border-border/70 bg-card/90 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous a votre espace d'administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom d'utilisateur</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="admin"
                            autoComplete="username"
                            spellCheck={false}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>Mot de passe</FormLabel>
                          <Link
                            href="/forgot-password"
                            className="text-primary ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            Mot de passe oublie ?
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
                    {isPending ? "Connexion..." : "Se connecter"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
