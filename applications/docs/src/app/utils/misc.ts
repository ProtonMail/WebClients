import useFlag from '@proton/unleash/useFlag'
import { isDevOrBlack, type BasePropertiesState, type BasePropertyValues } from '@proton/docs-shared'
import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react'

// use event
// ---------

// Classic pattern. Should probably be hoisted to a shared package with utils.
// Code taken from Ariakit (MIT License).

/**
 * Any function.
 */
export type AnyFunction = (...args: any) => any

/**
 * Creates a stable callback function that has access to the latest state and
 * can be used within event handlers and effect callbacks. Throws when used in
 * the render phase.
 * @example
 * function Component(props) {
 *   const onClick = useEvent(props.onClick);
 *   React.useEffect(() => {}, [onClick]);
 * }
 */
export function useEvent<T extends AnyFunction>(callback?: T) {
  const ref = useRef<AnyFunction | undefined>(() => {
    throw new Error('Cannot call an event handler while rendering.')
  })
  useInsertionEffect(() => {
    ref.current = callback
  })
  return useCallback<AnyFunction>((...args) => ref.current?.(...args), []) as T
}

// use subscribe
// -------------

/**
 * Subscribes to a property of a store and returns its up-to-date value.
 */
export function useSubscribe<T extends BasePropertyValues, K extends keyof T>(
  store: BasePropertiesState<T>,
  property: K,
): T[K] {
  const [value, setValue] = useState(store.getProperty(property))
  useEffect(() => store.subscribeToProperty(property, (newValue) => setValue(() => newValue)), [property, store])
  return value
}

export function useIsSheetsEnabled() {
  const killswitch = useFlag('DocsSheetsDisabled')
  return (useFlag('DocsSheetsEnabled') || isDevOrBlack()) && !killswitch
}

/**
 * Checks if the user is allowed to download logs.
 * It will only be active for alpha and dev/black environments for now.
 * @returns true if the user is allowed to download logs, false otherwise.
 */
export function useIsDownloadLogsAllowed() {
  return useFlag('DownloadLogs')
}
