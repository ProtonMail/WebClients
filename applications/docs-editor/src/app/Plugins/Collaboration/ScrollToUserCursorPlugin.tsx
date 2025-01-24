import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useApplication } from '../../Containers/ApplicationProvider'
import { useEffect } from 'react'
import type { Binding } from '@lexical/yjs'
import { getAnchorAndFocusCollabNodesForUserState } from '@lexical/yjs'
import type { UnsafeDocsUserState } from '@proton/docs-shared'

/**
 * On a `ScrollToUserCursorData` event call, it will use the passed
 * user state to get the user's selection and scroll to it.
 *
 * This file re-implements some functions that @lexical/yjs does not
 * export. Plan is to contribute to upstream a way to expose this
 * functionality without needing to expose library internals.
 *
 * We have to use this method instead of just finding the cursor element
 * in the DOM because:
 * 1. we don't have control over the rendered cursor element, so we cannot
 * attach info to it that could be used to find it.
 * 2. cursors are absolutely positioned outside the editor's scroll container
 * so trying to scroll it into view might not work.
 */
export function useScrollToUserCursorOnEvent(binding: Binding) {
  const { application } = useApplication()
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return application.syncedState.subscribeToEvent('ScrollToUserCursorData', (data) => {
      const { anchorCollabNode, focusCollabNode } = getAnchorAndFocusCollabNodesForUserState(
        binding,
        data.state as UnsafeDocsUserState,
      )

      if (anchorCollabNode !== null && focusCollabNode !== null) {
        const anchorKey = anchorCollabNode.getKey()
        const focusKey = focusCollabNode.getKey()

        const element = editor.getElementByKey(focusKey) || editor.getElementByKey(anchorKey)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
          })
        }
      }
    })
  }, [application.syncedState, binding, editor])

  return null
}
