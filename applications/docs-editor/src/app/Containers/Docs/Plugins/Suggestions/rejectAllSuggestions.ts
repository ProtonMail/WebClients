import type { LexicalEditor } from 'lexical'
import { $nodesOfType } from 'lexical'
import { $isSuggestionNode, ProtonNode } from './ProtonNode'
import { $rejectSuggestion } from './rejectSuggestion'

/**
 * Rejects all suggestions, unwrapping and removing
 * nodes where required.
 */
export function $rejectAllSuggestions() {
  const suggestionIDs = new Set(
    $nodesOfType(ProtonNode)
      .filter($isSuggestionNode)
      .map((node) => node.getSuggestionIdOrThrow()),
  )
  for (const id of suggestionIDs) {
    $rejectSuggestion(id)
  }
}

/**
 * Rejects all suggestions in a given editor, unwrapping and removing
 * nodes where required.
 */
export function rejectAllSuggestions(editor: LexicalEditor) {
  editor.update(
    () => {
      $rejectAllSuggestions()
    },
    { discrete: true },
  )
}
