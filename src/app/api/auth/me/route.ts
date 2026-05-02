import { NextResponse } from "next/server"

import { getCurrentAuthenticatedUser } from "@/lib/auth/server"

export async function GET() {
  const result = await getCurrentAuthenticatedUser()

  if (result.error) {
    return NextResponse.json(
      {
        message: result.error.message,
      },
      { status: result.error.status }
    )
  }

  return NextResponse.json(result.data, { status: 200 })
} 