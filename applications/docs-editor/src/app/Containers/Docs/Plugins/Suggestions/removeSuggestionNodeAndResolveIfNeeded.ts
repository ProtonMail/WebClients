import { $addUpdateTag } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { ResolveSuggestionsUpdateTag } from './SuggestionConstants'
import { $unwrapSuggestionNode } from './unwrapSuggestionNode'

export { ResolveSuggestionsUpdateTag } from './SuggestionConstants'

export function $removeSuggestionNodeAndResolveIfNeeded(node: ProtonNode) {
  node.remove()
  $addUpdateTag(ResolveSuggestionsUpdateTag)
}

export function $unwrapSuggestionNodeAndResolveIfNeeded(node: ProtonNode) {
  $unwrapSuggestionNode(node)
  $addUpdateTag(ResolveSuggestionsUpdateTag)
}
