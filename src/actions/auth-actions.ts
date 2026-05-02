"use server"

import type { AuthenticatedUser } from "@/store/api/auth/types"
import {
  forgotPasswordFormSchema,
  loginFormSchema,
  type ForgotPasswordFormValues,
  type LoginFormValues,
} from "@/lib/validation"
import {
  requestUserPasswordReset,
  signInUser,
  signOutUser,
} from "@/lib/auth/server"

type AuthActionResult = {
  status: "success" | "error"
  message?: string
  user?: AuthenticatedUser
  fieldErrors?: Record<string, string>
}

function flattenFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.entries(fieldErrors).reduce<Record<string, string>>(
    (accumulator, [key, value]) => {
      if (value?.[0]) {
        accumulator[key] = value[0]
      }

      return accumulator
    },
    {}
  )
}

export async function signInAction(
  values: LoginFormValues
): Promise<AuthActionResult> {
  const parsedValues = loginFormSchema.safeParse(values)

  if (!parsedValues.success) {
    return {
      status: "error",
      message: "Les informations de connexion sont invalides.",
      fieldErrors: flattenFieldErrors(parsedValues.error.flatten().fieldErrors),
    }
  }

  const result = await signInUser(parsedValues.data)

  if (result.error) {
    return {
      status: "error",
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
    }
  }

  return {
    status: "success",
    message: result.data?.message,
    user: result.data?.user,
  }
}

export async function forgotPasswordAction(
  values: ForgotPasswordFormValues
): Promise<AuthActionResult> {
  const parsedValues = forgotPasswordFormSchema.safeParse(values)

  if (!parsedValues.success) {
    return {
      status: "error",
      message: "L'adresse e-mail saisie est invalide.",
      fieldErrors: flattenFieldErrors(parsedValues.error.flatten().fieldErrors),
    }
  }

  const result = await requestUserPasswordReset(parsedValues.data)

  if (result.error) {
    return {
      status: "error",
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
    }
  }

  return {
    status: "success",
    message: result.data?.message,
  }
}

export async function signOutAction(): Promise<AuthActionResult> {
  const result = await signOutUser()

  if (result.error) {
    return {
      status: "error",
      message: result.error.message,
    }
  }

  return {
    status: "success",
    message: result.data?.message,
  }
}