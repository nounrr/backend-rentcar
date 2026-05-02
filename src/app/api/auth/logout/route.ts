import { NextResponse } from "next/server"

import { signOutUser } from "@/lib/auth/server"

export async function POST() {
  const result = await signOutUser()

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