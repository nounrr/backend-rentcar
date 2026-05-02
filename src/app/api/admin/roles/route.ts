import { NextResponse } from "next/server"

import { authorizedBackendRequest } from "@/lib/auth/server"

type RouteError = {
  status: number
  message: string
  fieldErrors: Record<string, string>
}

function buildErrorResponse(error: RouteError) {
  return NextResponse.json(
    {
      message: error.message,
      errors: Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined,
    },
    { status: error.status }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const result = await authorizedBackendRequest<unknown>({
    path: "/admin/roles",
    method: "GET",
    searchParams,
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const result = await authorizedBackendRequest<unknown>({
    path: "/admin/roles",
    method: "POST",
    body,
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}
