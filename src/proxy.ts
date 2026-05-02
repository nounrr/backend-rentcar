import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { AUTH_ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants"

const authRoutes = new Set(["/sign-in", "/forgot-password"])
const protectedPrefixes = ["/dashboard", "/users"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccessToken = Boolean(request.cookies.get(AUTH_ACCESS_TOKEN_COOKIE)?.value)

  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (authRoutes.has(pathname) && hasAccessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) && !hasAccessToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}