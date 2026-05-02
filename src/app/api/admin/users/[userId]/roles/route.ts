import { NextResponse } from "next/server"

import { authorizedBackendRequest } from "@/lib/auth/server"

function buildErrorResponse(error: { status: number; message: string; fieldErrors: Record<string, string> }) {
  return NextResponse.json(
    {
      message: error.message,
      errors: Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined,
    },
    { status: error.status }
  )
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params
  const body = await request.json().catch(() => ({}))

  const result = await authorizedBackendRequest<unknown>({
    path: `/admin/users/${userId}/roles`,
    method: "PUT",
    body,
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}