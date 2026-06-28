"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
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
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation"
import { toast } from "sonner"
import { forgotPasswordAction } from "@/actions/auth-actions"

export function ForgotPasswordForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [requestAccepted, setRequestAccepted] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = React.useCallback((values: ForgotPasswordFormValues) => {
    startTransition(async () => {
      const result = await forgotPasswordAction(values)

      if (result.status === "error") {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof ForgotPasswordFormValues, {
              type: "server",
              message,
            })
          })
        }

        toast.error(result.message ?? "La demande a echoue.")
        return
      }

      setRequestAccepted(true)
      setSuccessMessage(result.message ?? null)
      form.reset({ email: values.email })
    })
  }, [form])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="brand-panel border-border/70 bg-card/90 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Mot de passe oublie ?</CardTitle>
          <CardDescription>
            Saisissez votre adresse e-mail et nous vous enverrons un lien de reinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder="admin@smartlocation.com"
                            autoComplete="email"
                            inputMode="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
                    {isPending ? "Verification..." : "Envoyer le lien de reinitialisation"}
                  </Button>
                </div>
                {requestAccepted ? (
                  <p className="text-center text-sm text-muted-foreground" aria-live="polite">
                    {successMessage ?? "Si un compte existe pour cette adresse, un lien de reinitialisation sera envoye."}
                  </p>
                ) : null}
                <div className="text-center text-sm">
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <Link href="/sign-in" className="text-primary underline underline-offset-4">
                    Retour a la connexion
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
