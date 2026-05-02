import "server-only"

import { cookies } from "next/headers"

import type { AuthenticatedUser } from "@/store/api/auth/types"

import { AUTH_ACCESS_TOKEN_COOKIE, AUTH_USER_COOKIE } from "./constants"

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8,
}

function serializeUser(user: AuthenticatedUser) {
  return encodeURIComponent(JSON.stringify(user))
}

function deserializeUser(value: string) {
  try {
    return JSON.parse(decodeURIComponent(value)) as AuthenticatedUser
  } catch {
    return null
  }
}

export async function setAuthSession({
  accessToken,
  user,
}: {
  accessToken: string
  user: AuthenticatedUser
}) {
  const cookieStore = await cookies()

  cookieStore.set(AUTH_ACCESS_TOKEN_COOKIE, accessToken, authCookieOptions)
  cookieStore.set(AUTH_USER_COOKIE, serializeUser(user), authCookieOptions)
}

export async function setAuthUserCookie(user: AuthenticatedUser) {
  const cookieStore = await cookies()

  cookieStore.set(AUTH_USER_COOKIE, serializeUser(user), authCookieOptions)
}

export async function clearAuthSession() {
  const cookieStore = await cookies()

  cookieStore.delete(AUTH_ACCESS_TOKEN_COOKIE)
  cookieStore.delete(AUTH_USER_COOKIE)
}

export async function getAuthAccessToken() {
  const cookieStore = await cookies()

  return cookieStore.get(AUTH_ACCESS_TOKEN_COOKIE)?.value ?? null
}

export async function getAuthUser() {
  const cookieStore = await cookies()
  const value = cookieStore.get(AUTH_USER_COOKIE)?.value

  if (!value) {
    return null
  }

  return deserializeUser(value)
}