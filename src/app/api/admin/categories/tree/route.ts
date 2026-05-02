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

export async function GET() {
  const result = await authorizedBackendRequest<unknown>({
    path: "/admin/categories/tree",
    method: "GET",
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}
