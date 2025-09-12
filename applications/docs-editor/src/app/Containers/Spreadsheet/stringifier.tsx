import { useState } from 'react'

type Strings<K extends string = string> = Record<K, string>
type GetStrings<K extends string = string> = () => Strings<K>

const StringsMap = new WeakMap<GetStrings, Strings>()

function getOrCreateStrings<K extends string>(getStrings: GetStrings<K>): Strings<K> {
  let strings = StringsMap.get(getStrings)
  if (strings) {
    return strings
  }
  strings = getStrings()
  StringsMap.set(getStrings, strings)
  return strings
}

/**
 * Allows abstracting localization strings for a more readable code, without compromising
 * on good localization practices and tooling (like linting, extractions, etc.).
 *
 * Just make sure that if a string is changed, both the key and the string are updated
 * and always the same.
 *
 * @example
 * ```
 * const { s } = createStringifier(strings)
 *
 * function MyComponent() {
 *   return <div>{s('My string')}</div>
 * }
 *
 * function strings() {
 *   return {
 *     'My string': c('My potentially long and noisy context').t`My string`,
 *   }
 * }
 * ```
 */
export function createStringifier<K extends string>(getStrings: GetStrings<K>) {
  function s(s: K) {
    return getOrCreateStrings(getStrings)[s]
  }
  return { s }
}

/**
 * @deprecated Use `createStringifier` instead.
 */
export function useStringifier<K extends string>(getStrings: () => Record<K, string>) {
  // We lazily initialize the getter function into a state so that it happens only once
  // in the component's lifecycle.
  const [get] = useState(() => (s: K) => getStrings()[s])
  return get
}
