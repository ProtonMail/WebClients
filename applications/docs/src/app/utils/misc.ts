import { useCallback, useInsertionEffect, useRef } from 'react'

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

