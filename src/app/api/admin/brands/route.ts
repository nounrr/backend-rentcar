import { NextResponse } from "next/server"

import { authorizedBackendRequest } from "@/lib/auth/server"

async function readRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""

  if (!contentType.includes("multipart/form-data")) {
    return request.json().catch(() => ({}))
  }

  const incomingFormData = await request.formData().catch(() => new FormData())
  const formData = new FormData()

  for (const [key, value] of incomingFormData.entries()) {
    if (typeof value === "string") {
      if (value.length > 0) {
        formData.append(key, value)
      }

      continue
    }

    if (value.size > 0) {
      formData.append(key, value, value.name)
    }
  }

  return formData
}

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
    path: "/admin/brands",
    method: "GET",
    searchParams,
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}

export async function POST(request: Request) {
  const body = await readRequestBody(request)

  const result = await authorizedBackendRequest<unknown>({
    path: "/admin/brands",
    method: "POST",
    body,
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}
