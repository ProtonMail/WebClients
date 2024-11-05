import { $addUpdateTag } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { $unwrapSuggestionNode } from './Utils'

export const ResolveSuggestionsUpdateTag = 'resolve-suggestions-if-needed'

export function $removeSuggestionNodeAndResolveIfNeeded(node: ProtonNode) {
  node.remove()
  $addUpdateTag(ResolveSuggestionsUpdateTag)
}

export function $unwrapSuggestionNodeAndResolveIfNeeded(node: ProtonNode) {
  $unwrapSuggestionNode(node)
  $addUpdateTag(ResolveSuggestionsUpdateTag)
}
