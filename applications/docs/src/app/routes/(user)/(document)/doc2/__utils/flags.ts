import { useFlag } from '@proton/unleash/useFlag'

/** A public link's editors edit, and every visitor's page connects; off, they view the latest commit */
export function usePublicEditingEnabled() {
  return useFlag('DocsPublicEditing')
}
