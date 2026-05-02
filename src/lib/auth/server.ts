import "server-only"

import type {
  AuthenticatedUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  SignInRequest,
  SignInResponse,
  SignOutResponse,
} from "@/store/api/auth/types"
import {
  backendRequest,
  type BackendError,
  type BackendRequestOptions,
  type BackendRequestResult,
} from "@/lib/server/backend-api"

import {
  clearAuthSession,
  getAuthAccessToken,
  getAuthUser,
  setAuthSession,
  setAuthUserCookie,
} from "./session"

type BackendLoginPayload = {
  token?: string
  message?: string
  user?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function extractNamedValues(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.reduce<string[]>((accumulator, item) => {
    if (typeof item === "string") {
      accumulator.push(item)
      return accumulator
    }

    if (isRecord(item) && typeof item.name === "string") {
      accumulator.push(item.name)
    }

    return accumulator
  }, [])
}

function normalizeAuthenticatedUser(payload: unknown): AuthenticatedUser {
  const source = isRecord(payload) ? payload : {}

  return {
    id:
      typeof source.id === "number" || typeof source.id === "string"
        ? source.id
        : "",
    name: typeof source.name === "string" ? source.name : "",
    email: typeof source.email === "string" ? source.email : "",
    phone: typeof source.phone === "string" ? source.phone : null,
    cin: typeof source.cin === "string" ? source.cin : null,
    job_title: typeof source.job_title === "string" ? source.job_title : null,
    is_active: typeof source.is_active === "boolean" ? source.is_active : true,
    roles: extractNamedValues(source.roles),
    permissions: extractNamedValues(source.permissions),
  }
}

function unauthorizedResult<T>(message = "Vous devez etre connecte pour continuer.") {
  return {
    data: null,
    error: {
      status: 401,
      message,
      fieldErrors: {},
      data: { message },
    } satisfies BackendError,
    response: new Response(null, { status: 401 }),
  } satisfies BackendRequestResult<T>
}

export async function signInUser(
  credentials: SignInRequest
): Promise<BackendRequestResult<SignInResponse>> {
  const result = await backendRequest<BackendLoginPayload>({
    path: "/users/login",
    method: "POST",
    body: credentials,
  })

  if (result.error) {
    await clearAuthSession()
    return result as BackendRequestResult<SignInResponse>
  }

  const accessToken =
    result.data && typeof result.data.token === "string" ? result.data.token : null

  if (!accessToken) {
    await clearAuthSession()

    return unauthorizedResult<SignInResponse>(
      "Le jeton de session n'a pas ete retourne par l'API."
    )
  }

  const user = normalizeAuthenticatedUser(result.data?.user)

  await setAuthSession({ accessToken, user })

  return {
    data: {
      user,
      message:
        typeof result.data?.message === "string"
          ? result.data.message
          : "Connexion reussie.",
    },
    error: null,
    response: result.response,
  }
}

export async function requestUserPasswordReset(
  payload: ForgotPasswordRequest
): Promise<BackendRequestResult<ForgotPasswordResponse>> {
  return backendRequest<ForgotPasswordResponse>({
    path: "/users/forgot-password",
    method: "POST",
    body: payload,
  })
}

export async function getCurrentAuthenticatedUser(): Promise<
  BackendRequestResult<AuthenticatedUser>
> {
  const accessToken = await getAuthAccessToken()

  if (!accessToken) {
    await clearAuthSession()
    return unauthorizedResult<AuthenticatedUser>()
  }

  const cachedUser = await getAuthUser()

  if (cachedUser) {
    return {
      data: cachedUser,
      error: null,
      response: new Response(null, { status: 200 }),
    }
  }

  const result = await backendRequest<unknown>({
    path: "/users/me",
    method: "GET",
    accessToken,
  })

  if (result.error) {
    if (result.error.status === 401 || result.error.status === 403) {
      await clearAuthSession()
    }

    return result as BackendRequestResult<AuthenticatedUser>
  }

  const user = normalizeAuthenticatedUser(result.data)

  await setAuthUserCookie(user)

  return {
    data: user,
    error: null,
    response: result.response,
  }
}

export async function signOutUser(): Promise<BackendRequestResult<SignOutResponse>> {
  const accessToken = await getAuthAccessToken()

  if (!accessToken) {
    await clearAuthSession()

    return {
      data: { message: "Session fermee." },
      error: null,
      response: new Response(null, { status: 200 }),
    }
  }

  const result = await backendRequest<SignOutResponse>({
    path: "/users/logout",
    method: "POST",
    accessToken,
  })

  await clearAuthSession()

  if (result.error) {
    return {
      data: { message: "Session fermee." },
      error: null,
      response: result.response,
    }
  }

  return result
}

export async function authorizedBackendRequest<T>(
  options: Omit<BackendRequestOptions, "accessToken">
): Promise<BackendRequestResult<T>> {
  const accessToken = await getAuthAccessToken()

  if (!accessToken) {
    await clearAuthSession()
    return unauthorizedResult<T>()
  }

  const result = await backendRequest<T>({
    ...options,
    accessToken,
  })

  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    await clearAuthSession()
  }

  return result
}