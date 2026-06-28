"use client"

import type { AuthenticatedUser } from "@/store/api/auth/types"

import { AUTH_ACCESS_TOKEN_COOKIE, AUTH_USER_COOKIE } from "./constants"

// Stockage du token + user cote navigateur (SPA statique, plus de cookie httpOnly serveur).
const TOKEN_KEY = AUTH_ACCESS_TOKEN_COOKIE
const USER_KEY = AUTH_USER_COOKIE

function isBrowser() {
  return typeof window !== "undefined"
}

export function getStoredAccessToken(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser(): AuthenticatedUser | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null
  } catch {
    return null
  }
}

export function setStoredAuth(token: string, user: AuthenticatedUser | null): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  } catch {
    // localStorage indisponible (mode prive, quota) : on ignore silencieusement.
  }
}

export function setStoredUser(user: AuthenticatedUser | null): void {
  if (!isBrowser()) return
  try {
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(USER_KEY)
    }
  } catch {
    // ignore
  }
}

export function clearStoredAuth(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}
