import { combineReducers, configureStore } from "@reduxjs/toolkit"

import type { AuthenticatedUser } from "@/store/api/auth/types"
import { baseApi } from "@/store/api/base-api"
import { sessionReducer } from "@/store/slices/session-slice"

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  session: sessionReducer,
})

export type RootState = ReturnType<typeof rootReducer>

type PreloadedStoreState = Partial<{
  api: RootState[typeof baseApi.reducerPath]
  session: {
    user: AuthenticatedUser | null
  }
}>

export const makeStore = (preloadedState?: PreloadedStoreState) =>
  configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as Partial<RootState> | undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  })

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore["dispatch"]