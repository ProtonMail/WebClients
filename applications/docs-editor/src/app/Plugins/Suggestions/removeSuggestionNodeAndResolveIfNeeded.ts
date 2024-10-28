import { $addUpdateTag } from 'lexical'
import type { ProtonNode } from './ProtonNode'

export const ResolveSuggestionsUpdateTag = 'resolve-suggestions-if-needed'

export function $removeSuggestionNodeAndResolveIfNeeded(node: ProtonNode) {
  node.remove()
  $addUpdateTag(ResolveSuggestionsUpdateTag)
}
