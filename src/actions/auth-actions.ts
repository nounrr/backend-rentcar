"use client"

import type { AuthenticatedUser } from "@/store/api/auth/types"
import {
  forgotPasswordFormSchema,
  loginFormSchema,
  type ForgotPasswordFormValues,
  type LoginFormValues,
} from "@/lib/validation"
import { apiConfig } from "@/config/api"
import {
  clearStoredAuth,
  getStoredAccessToken,
  setStoredAuth,
} from "@/lib/auth/client-token"
import { normalizeAuthenticatedUser } from "@/lib/auth/normalize-user"

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

type BackendError = { message?: string; errors?: Record<string, string[] | string> }

function extractError(payload: BackendError | null, fallback: string): { message: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {}
  if (payload?.errors) {
    for (const [key, value] of Object.entries(payload.errors)) {
      if (Array.isArray(value) && typeof value[0] === "string") fieldErrors[key] = value[0]
      else if (typeof value === "string") fieldErrors[key] = value
    }
  }
  return { message: payload?.message ?? fallback, fieldErrors }
}

async function backendCall(path: string, body: unknown, withAuth = false) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
  if (withAuth) {
    const token = getStoredAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${apiConfig.backendBaseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  return { ok: response.ok, status: response.status, payload }
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

  try {
    const { ok, payload } = await backendCall(apiConfig.routes.auth.signIn, parsedValues.data)
    const data = payload as { token?: string; message?: string; user?: unknown } & BackendError

    if (!ok) {
      const err = extractError(data, "Identifiants invalides.")
      clearStoredAuth()
      return { status: "error", message: err.message, fieldErrors: err.fieldErrors }
    }

    const user = normalizeAuthenticatedUser(data.user)
    if (data.token) {
      setStoredAuth(data.token, user)
    }

    return { status: "success", message: data.message, user }
  } catch {
    return { status: "error", message: "Connexion au serveur impossible." }
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

  try {
    const { ok, payload } = await backendCall(apiConfig.routes.auth.forgotPassword, parsedValues.data)
    const data = payload as { message?: string } & BackendError

    if (!ok) {
      const err = extractError(data, "Envoi impossible.")
      return { status: "error", message: err.message, fieldErrors: err.fieldErrors }
    }

    return { status: "success", message: data.message }
  } catch {
    return { status: "error", message: "Connexion au serveur impossible." }
  }
}

export async function signOutAction(): Promise<AuthActionResult> {
  try {
    await backendCall(apiConfig.routes.auth.signOut, {}, true)
  } catch {
    // on deconnecte localement meme si l'appel reseau echoue
  } finally {
    clearStoredAuth()
  }

  return { status: "success", message: "Deconnexion reussie." }
}
