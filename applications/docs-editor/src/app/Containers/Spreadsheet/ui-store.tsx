import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { create, type StoreApi, type UseBoundStore } from 'zustand'
import type { ProtonSheetsState } from './state'
import { type ProtonSheetsUIState, useProtonSheetsUIState } from './ui-state'

export type ProtonSheetsUIStore = UseBoundStore<StoreApi<ProtonSheetsUIState>>
export type ProtonSheetsUIStoreSetters = FunctionsOnly<ProtonSheetsUIState>
export type ProtonSheetsUIStoreContextValue = { useUI: ProtonSheetsUIStore; setters: ProtonSheetsUIStoreSetters }

const ProtonSheetsUIStoreContext = createContext<ProtonSheetsUIStoreContextValue | undefined>(undefined)

export type ProtonSheetsUIStoreProviderProps = {
  state: ProtonSheetsState
  children: ReactNode
}

/**
 * See `useUI` for usage.
 */
export function ProtonSheetsUIStoreProvider({ state, children }: ProtonSheetsUIStoreProviderProps) {
  const uiState = useProtonSheetsUIState(state)

  // keep a ref to the latest ui state for use in the setters getter
  const uiStateRef = useRef(uiState)
  useInsertionEffect(() => {
    uiStateRef.current = uiState
  }, [uiState])

  // create the zustand store only once
  const createStore = () => create(() => uiState)
  const [useUI] = useState<ProtonSheetsUIStore>(() => createStore())

  // keep the zustand store up to date with the latest ui state
  useEffect(() => {
    useUI.setState(uiState, true)
  }, [useUI, uiState])

  // prepare the context value
  const value = useMemo(
    () => ({
      useUI,
      // this is a setters getter, set here letter by letter to better get the setters, get it?
      get setters() {
        return uiStateRef.current
      },
    }),
    [useUI],
  )

  return <ProtonSheetsUIStoreContext.Provider value={value}>{children}</ProtonSheetsUIStoreContext.Provider>
}

function useProtonSheetsUIStore() {
  const context = useContext(ProtonSheetsUIStoreContext)
  if (!context) {
    throw new Error('useProtonSheetsUIStore must be used within a ProtonSheetsUIStoreProvider')
  }
  return context
}

/**
 * To ensure better performance, the UI state is stored in a zustand store and kept up to date on every
 * change. Then, components can use it via the `useUI` hook, in a granular way, by passing a selector.
 *
 * Setters are also exposed directly in a non-stateful way (for use in callbacks and effects) via `useUI.$`.
 * Technically, `useUI.$` is not just for getters, but also for any functions in the UI state like helpers.
 * `useUI.$` is a hook, so it must follow the rules of hooks. If this is a problem, just extract the setter
 * into a variable early in the component body for later usage.
 *
 * Note that we are not using zustand setters, as its use is limited to reading and subscribing to values
 * in a fine-grained manner.
 *
 * @example
 * ```tsx
 * function Component() {
 *   return <input
 *     // Obtain a value. The component will re-render when the output of the selector changes.
 *     value={useUI(ui => ui.example.value)}
 *     // Use a setter. The component will NOT re-render regardless of the value of the setter,
 *     // which should always be stable (e.g. via useEvent in `ui-state.ts`).
 *     onChange={e => useUI.$.example.set(e.target.value)} />
 * }
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: it's fine.
export const useUI = ((...args: any[]) => {
  const { useUI } = useProtonSheetsUIStore()
  // @ts-expect-error it's fine
  return useUI(...args)
}) as ProtonSheetsUIStore & {
  /**
   * Setters for the UI state. Technically a hook, so it must follow the rules of hooks.
   * If this is a problem, just extract the setter into a variable early in the component
   * body for later usage.
   *
   * Once we upgrade to React 19, we should be able to get around this limitation by using
   * `use` for the context, which does not have the same restrictions.
   */
  $: ProtonSheetsUIStoreSetters
}
Object.defineProperty(useUI, '$', {
  get() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useProtonSheetsUIStore().setters
  },
})

/**
 * Omits non-function properties from a type, recursively. Useful in this case to prevent using
 * values without a proper subscription when using `useUI.$`, as that API is meant exclusively
 * for setters, which should always be stable (e.g. via useEvent in `ui-state.ts`).
 */
// biome-ignore lint/suspicious/noExplicitAny: it's fine.
type FunctionsOnly<T> = T extends (...args: any) => any
  ? T
  : // biome-ignore lint/suspicious/noExplicitAny: it's fine.
    T extends readonly any[] // treat arrays as leaves; drop them
    ? never
    : T extends object
      ? {
          [K in keyof T as FunctionsOnly<T[K]> extends never ? never : K]: FunctionsOnly<T[K]>
        } extends infer O
        ? keyof O extends never
          ? never
          : { [K in keyof O]: O[K] }
        : never
      : never
