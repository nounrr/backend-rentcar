"use client"

import * as React from "react"
import { Provider } from "react-redux"
import { setupListeners } from "@reduxjs/toolkit/query"

import type { AuthenticatedUser } from "@/store/api/auth/types"
import { setCurrentUser } from "@/store/slices/session-slice"
import { makeStore, type AppStore } from "@/store/store"

export function StoreProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: AuthenticatedUser | null
}) {
  const storeRef = React.useRef<AppStore | null>(null)

  if (!storeRef.current) {
    storeRef.current = makeStore({
      session: {
        user: initialUser,
      },
    })
    setupListeners(storeRef.current.dispatch)
  }

  React.useEffect(() => {
    storeRef.current?.dispatch(setCurrentUser(initialUser))
  }, [initialUser])

  return <Provider store={storeRef.current}>{children}</Provider>
}