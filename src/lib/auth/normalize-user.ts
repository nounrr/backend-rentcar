import type { AuthenticatedUser } from "@/store/api/auth/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

// Laravel renvoie roles/permissions soit comme tableaux de strings,
// soit comme tableaux d'objets { name }. On normalise vers string[].
function extractNamedValues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.reduce<string[]>((accumulator, item) => {
    if (typeof item === "string") {
      accumulator.push(item)
      return accumulator
    }

    if (isRecord(item) && typeof item.name === "string") {
      accumulator.push(item.name)
    }

    return accumulator
  }, [])
}

export function normalizeAuthenticatedUser(payload: unknown): AuthenticatedUser {
  const source = isRecord(payload) ? payload : {}

  return {
    id:
      typeof source.id === "number" || typeof source.id === "string"
        ? source.id
        : "",
    name: typeof source.name === "string" ? source.name : "",
    username: typeof source.username === "string" ? source.username : "",
    email: typeof source.email === "string" ? source.email : "",
    phone: typeof source.phone === "string" ? source.phone : null,
    cin: typeof source.cin === "string" ? source.cin : null,
    job_title: typeof source.job_title === "string" ? source.job_title : null,
    is_active: typeof source.is_active === "boolean" ? source.is_active : true,
    roles: extractNamedValues(source.roles),
    permissions: extractNamedValues(source.permissions),
  }
}
