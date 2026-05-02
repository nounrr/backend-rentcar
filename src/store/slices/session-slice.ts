import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { AuthenticatedUser } from "@/store/api/auth/types"
import type { RootState } from "@/store/store"

type SessionState = {
  user: AuthenticatedUser | null
}

type SessionPayload = {
  user: AuthenticatedUser | null
}

const initialState: SessionState = {
  user: null,
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionPayload>) {
      state.user = action.payload.user
    },
    setCurrentUser(state, action: PayloadAction<AuthenticatedUser | null>) {
      state.user = action.payload
    },
    clearSession: () => initialState,
  },
})

export const { clearSession, setCurrentUser, setSession } = sessionSlice.actions

export const sessionReducer = sessionSlice.reducer

export const selectSession = (state: RootState) => state.session
export const selectCurrentUser = (state: RootState) => state.session.user
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.session.user)