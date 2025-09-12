import { forwardRef, memo, useCallback, useInsertionEffect, useRef } from 'react'

/**
 * Any function.
 */
// biome-ignore lint/suspicious/noExplicitAny: it's fine.
type AnyFunction = (...args: any) => any
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

export type Component<P> = ((props: P) => React.ReactElement | null) & { displayName?: string }

/**
 * Creates components that's memoized and forwards its ref. The ref is passed as part of the props.
 * Once we upgrade to React 19, we should be able to drop the ref part, at which point this function
 * can be dropped in favor of just using `memo` directly when necessary.
 */
export function createComponent<P>(render: (props: P) => React.ReactElement | null): Component<P> {
  // @ts-expect-error it's fine.
  // eslint-disable-next-line react/display-name
  const Component = forwardRef((props, ref) => render({ ref, ...props }))
  const MemoizedComponent = memo(Component)
  if (render.name) {
    MemoizedComponent.displayName = render.name
  }
  // biome-ignore lint/suspicious/noExplicitAny: it's fine.
  return MemoizedComponent as any
}
