import type { BasePropertiesState, BasePropertyValues } from 'packages/docs-shared'
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
  /**
   * The store to subscribe to.
   */
  store: BasePropertiesState<T>,
  /**
   * The property from the store to subscribe to.
   */
  property: K,
  /**
   * The initial value to use before the store updates for the first time.
   */
  initialValue: T[K],
): T[K]
export function useSubscribe<T extends BasePropertyValues, K extends keyof T>(
  store: BasePropertiesState<T>,
  property: K,
  initialValue?: undefined,
): T[K] | undefined
export function useSubscribe<T extends BasePropertyValues, K extends keyof T>(
  store: BasePropertiesState<T>,
  property: K,
  initialValue?: T[K],
): T[K] | undefined {
  const [value, setValue] = useState(initialValue)
  useEffect(() =>
    store.subscribeToProperty(property, (newValue) => {
      setValue(newValue)
    }),
  )
  return value
}
