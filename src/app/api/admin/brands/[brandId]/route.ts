import { NextResponse } from "next/server"

import { authorizedBackendRequest } from "@/lib/auth/server"

async function readRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""

  if (!contentType.includes("multipart/form-data")) {
    return {
      body: await request.json().catch(() => ({})),
      method: "PUT" as const,
    }
  }

  const incomingFormData = await request.formData().catch(() => new FormData())
  const formData = new FormData()
  formData.set("_method", "PUT")

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

  return {
    body: formData,
    method: "POST" as const,
  }
}

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
  context: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await context.params

  const result = await authorizedBackendRequest<unknown>({
    path: `/admin/brands/${brandId}`,
    method: "GET",
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await context.params
  const { body, method } = await readRequestBody(request)

  const result = await authorizedBackendRequest<unknown>({
    path: `/admin/brands/${brandId}`,
    method,
    body,
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await context.params

  const result = await authorizedBackendRequest<unknown>({
    path: `/admin/brands/${brandId}`,
    method: "DELETE",
  })

  if (result.error) {
    return buildErrorResponse(result.error)
  }

  return NextResponse.json(result.data, { status: result.response.status })
}
