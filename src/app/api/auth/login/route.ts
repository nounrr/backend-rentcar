import { NextResponse } from "next/server"

import { signInUser } from "@/lib/auth/server"

function buildErrorResponse(error: { status: number; message: string; fieldErrors: Record<string, string> }) {
  return NextResponse.json(
    {
      message: error.message,
      errors: Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined,
    },
    { status: error.status }
  )
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string
    password?: string
  }

  const result = await signInUser({
    username: body.username ?? "",
    password: body.password ?? "",
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}