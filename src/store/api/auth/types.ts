export type UserId = number | string

export interface AuthenticatedUser {
  id: UserId
  name: string
  username: string
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
  token?: string
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

export interface UpdateProfileRequest {
  name: string
  email: string
  phone?: string | null
  cin?: string | null
  job_title?: string | null
}

export interface UpdateProfileResponse {
  message: string
  user: AuthenticatedUser
}

export interface UpdatePasswordRequest {
  current_password: string
  password: string
  password_confirmation: string
}

export interface UpdatePasswordResponse {
  message: string
}
