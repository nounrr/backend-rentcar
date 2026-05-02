export type UserId = number | string

export interface AuthenticatedUser {
  id: UserId
  name: string
  email: string
  phone: string | null
  cin: string | null
  job_title: string | null
  is_active: boolean
  roles?: string[]
  permissions?: string[]
}

export interface SignInRequest {
  username: string
  password: string
}

export interface SignInResponse {
  user: AuthenticatedUser
  message?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface SignOutResponse {
  message: string
}