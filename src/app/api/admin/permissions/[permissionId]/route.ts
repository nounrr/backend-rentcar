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

export async function GET(
  _request: Request,
  context: { params: Promise<{ permissionId: string }> }
) {
  const { permissionId } = await context.params

  const result = await authorizedBackendRequest<unknown>({
    path: `/admin/permissions/${permissionId}`,
    method: "GET",
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ permissionId: string }> }
) {
  const { permissionId } = await context.params
  const body = await request.json().catch(() => ({}))

  const result = await authorizedBackendRequest<unknown>({
    path: `/admin/permissions/${permissionId}`,
    method: "PUT",
    body,
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ permissionId: string }> }
) {
  const { permissionId } = await context.params

  const result = await authorizedBackendRequest<unknown>({
    path: `/admin/permissions/${permissionId}`,
    method: "DELETE",
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}
