"use client"

import * as React from "react"
import { Provider } from "react-redux"
import { setupListeners } from "@reduxjs/toolkit/query"

import { getStoredUser } from "@/lib/auth/client-token"
import { makeStore, type AppStore } from "@/store/store"

export function StoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const storeRef = React.useRef<AppStore | null>(null)

  if (!storeRef.current) {
    // Hydrate la session depuis localStorage (SPA statique : pas d'etat serveur).
    storeRef.current = makeStore({
      session: {
        user: getStoredUser(),
      },
    })
    setupListeners(storeRef.current.dispatch)
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
