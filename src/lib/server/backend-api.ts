import "server-only"

import { apiConfig } from "@/config/api"

type SearchParamValue = string | number | boolean | null | undefined

export type BackendFieldErrors = Record<string, string>

export type BackendError = {
  status: number
  message: string
  fieldErrors: BackendFieldErrors
  data: unknown
}

export type BackendRequestOptions = {
  path: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  accessToken?: string | null
  searchParams?: URLSearchParams | Record<string, SearchParamValue>
  headers?: HeadersInit
  cache?: RequestCache
}

export type BackendRequestResult<T> = {
  data: T | null
  error: BackendError | null
  response: Response
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function buildSearchParams(
  searchParams?: URLSearchParams | Record<string, SearchParamValue>
) {
  if (!searchParams) {
    return ""
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.toString()
  }

  const params = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return
    }

    params.set(key, String(value))
  })

  return params.toString()
}

function buildBackendUrl(
  path: string,
  searchParams?: URLSearchParams | Record<string, SearchParamValue>
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const queryString = buildSearchParams(searchParams)

  if (!queryString) {
    return `${apiConfig.backendBaseUrl}${normalizedPath}`
  }

  return `${apiConfig.backendBaseUrl}${normalizedPath}?${queryString}`
}

async function readPayload(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function extractMessage(payload: unknown, fallback: string) {
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message
  }

  if (typeof payload === "string" && payload.length > 0) {
    return payload
  }

  return fallback
}

function extractFieldErrors(payload: unknown): BackendFieldErrors {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return {}
  }

  return Object.entries(payload.errors).reduce<BackendFieldErrors>(
    (accumulator, [key, value]) => {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        accumulator[key] = value[0]
        return accumulator
      }

      if (typeof value === "string") {
        accumulator[key] = value
      }

      return accumulator
    },
    {}
  )
}

export async function backendRequest<T>({
  path,
  method = "GET",
  body,
  accessToken,
  searchParams,
  headers: customHeaders,
  cache = "no-store",
}: BackendRequestOptions): Promise<BackendRequestResult<T>> {
  const headers = new Headers(customHeaders)

  headers.set("Accept", "application/json")

  let requestBody: BodyInit | undefined

  if (body instanceof FormData || body instanceof URLSearchParams || typeof body === "string") {
    requestBody = body
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json")
    requestBody = JSON.stringify(body)
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(buildBackendUrl(path, searchParams), {
    method,
    headers,
    body: requestBody,
    cache,
  })

  const payload = await readPayload(response)

  if (!response.ok) {
    return {
      data: null,
      error: {
        status: response.status,
        message: extractMessage(payload, "La requete vers l'API a echoue."),
        fieldErrors: extractFieldErrors(payload),
        data: payload,
      },
      response,
    }
  }

  return {
    data: payload as T,
    error: null,
    response,
  }
}