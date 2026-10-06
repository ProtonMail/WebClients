import type { LexicalEditor } from 'lexical'

import { $canShowPlaceholderCurry } from '@lexical/text'
import { mergeRegister } from '@lexical/utils'
import { useLayoutEffect, useState } from 'react'

function canShowPlaceholderFromCurrentEditorState(editor: LexicalEditor): boolean {
  const currentCanShowPlaceholder = editor.getEditorState().read($canShowPlaceholderCurry(editor.isComposing()))

  return currentCanShowPlaceholder
}

/**
 * This is used by the ContentEditable component to determine whether it can display
 * the placeholder or not. The heuristics for when the placeholder can or cannot
 * be shown are not defined in this hook, it merely holds and updates the state.
 */
export function useCanShowPlaceholder(editor: LexicalEditor): boolean {
  const [canShowPlaceholder, setCanShowPlaceholder] = useState(() => canShowPlaceholderFromCurrentEditorState(editor))

  useLayoutEffect(() => {
    function resetCanShowPlaceholder() {
      const currentCanShowPlaceholder = canShowPlaceholderFromCurrentEditorState(editor)
      setCanShowPlaceholder(currentCanShowPlaceholder)
    }
    resetCanShowPlaceholder()
    return mergeRegister(
      editor.registerUpdateListener(() => {
        resetCanShowPlaceholder()
      }),
      editor.registerEditableListener(() => {
        resetCanShowPlaceholder()
      }),
    )
  }, [editor])

  return canShowPlaceholder
}
