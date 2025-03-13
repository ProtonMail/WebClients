import type { TypedStartListening } from '@reduxjs/toolkit'
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'

import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable'

import { start } from './listener'
import { type DocsState, persistReducer, rootReducer } from './rootReducer'
import { type DocsThunkArguments, extraThunkArguments } from './thunk'
import { getPersistedState } from '@proton/redux-shared-store/persist'

export const setupStore = ({
  preloadedState,
  persist,
}: {
  preloadedState?: Partial<DocsState>
  persist?: boolean
} = {}) => {
  const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments })

  const store = configureStore({
    preloadedState,
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [...ignoredActions],
          ignoredPaths: [...ignoredPaths],
        },
        thunk: { extraArgument: extraThunkArguments },
      }).prepend(listenerMiddleware.middleware),
  })

  const startListening = listenerMiddleware.startListening as AppStartListening
  const getDocsPersistedState = persist ? (state: DocsState) => getPersistedState(state, persistReducer) : undefined
  start({ startListening, persistTransformer: getDocsPersistedState })

  if (process.env.NODE_ENV !== 'production' && module.hot) {
    module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer))
    module.hot.accept('./listener', () => {
      listenerMiddleware.clearListeners()
      start({ startListening, persistTransformer: getDocsPersistedState })
    })
  }

  return Object.assign(store, {
    unsubscribe: () => {
      listenerMiddleware.clearListeners()
    },
  })
}

export const extendStore = (newThunkArguments: Partial<DocsThunkArguments>) => {
  Object.assign(extraThunkArguments, newThunkArguments)
}

export type DocsStore = ReturnType<typeof setupStore>
export type DocsDispatch = DocsStore['dispatch']
type ExtraArgument = typeof extraThunkArguments

export type AppStartListening = TypedStartListening<DocsState, DocsDispatch, ExtraArgument>
