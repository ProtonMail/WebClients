import { useState } from 'react'

/**
 * Allows abstracting some localization for a more readable code, without compromising
 * on good localization practices and tooling (like linting, extractions, etc.).
 *
 * Just make sure that if a string is changed, both the key and the string are updated
 * and always the same.
 *
 * @example
 * ```
 * function MyComponent() {
 *   const s = useStrings()
 *   return <div>{s('My string')}</div>
 * }
 *
 * function useStrings() {
 *   return useStringifier(() => ({
 *     'My string': c('My potentially long and noisy context').t`My string`,
 *   }))
 * }
 * ```
 */
export function useStringifier<K extends string>(getStrings: () => Record<K, string>) {
  // We lazily initialize the getter function into a state so that it happens only once
  // in the component's lifecycle.
  const [get] = useState(() => (s: K) => getStrings()[s])
  return get
}
