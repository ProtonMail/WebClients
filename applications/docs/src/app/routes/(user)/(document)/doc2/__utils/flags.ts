import { isLocalEnvironment } from '@proton/shared/lib/env'
import { useFlag } from '@proton/unleash/useFlag'

/** A public link's editors edit, and every visitor's page connects; off, they view the latest commit */
export function usePublicEditingEnabled() {
  return useFlag('DocsPublicEditing')
}

/**
 * Whether Suggesting is on, as /doc decides it: unless `DocsSuggestionsDisabled`, and always in a local environment.
 * The editor offers it only with the session's comments, which keep a suggestion's thread, so never to a viewer or a
 * public link's visitor.
 */
export function useSuggestionsAllowed(): boolean {
  const isDisabled = useFlag('DocsSuggestionsDisabled')
  return !isDisabled || isLocalEnvironment()
}
