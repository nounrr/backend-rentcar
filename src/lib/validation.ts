import { z } from "zod"

export const loginFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Veuillez saisir votre nom d'utilisateur")
    .max(255, "Le nom d'utilisateur ne doit pas depasser 255 caracteres"),
  password: z
    .string()
    .min(1, "Veuillez saisir votre mot de passe")
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .max(128, "Le mot de passe ne doit pas depasser 128 caracteres"),
})

export const forgotPasswordFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Veuillez saisir votre adresse e-mail")
    .email("Veuillez saisir une adresse e-mail valide")
    .max(255, "L'adresse e-mail ne doit pas depasser 255 caracteres")
    .transform((value) => value.toLowerCase()),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>

export const validationSchemas = {
  login: loginFormSchema,
  forgotPassword: forgotPasswordFormSchema,
} as const