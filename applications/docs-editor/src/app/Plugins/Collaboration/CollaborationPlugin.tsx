import type { Doc } from 'yjs'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { Provider } from '@lexical/yjs'
import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'

import { useYjsCollaboration } from './useYjsCollaboration'
import { useYjsHistory } from './useYjsHistory'
import type { EditorInitializationConfig } from '@proton/docs-shared'
import { useYjsFocusTracking } from './useYjsFocusTracking'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import { useScrollToUserCursorOnEvent } from './ScrollToUserCursorPlugin'
import { useCustomCollaborationContext } from './CustomCollaborationContext'

type Props = {
  id: string
  providerFactory: (
    // eslint-disable-next-line no-shadow
    id: string,
    yjsDocMap: Map<string, Doc>,
  ) => Provider
  shouldBootstrap: boolean
  onLoadResult: EditorLoadResult
  cursorsContainer: HTMLElement | null
  editorInitializationConfig: EditorInitializationConfig | undefined
  additionalAwarenessData: object
}

export function CollaborationPlugin({
  id,
  providerFactory,
  onLoadResult,
  cursorsContainer,
  editorInitializationConfig,
  additionalAwarenessData,
}: Props): ReactNode {
  const collabContext = useCustomCollaborationContext()

  const { yjsDocMap, name, color } = collabContext

  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    collabContext.isCollabActive = true

    return () => {
      // Reseting flag only when unmount top level editor collab plugin. Nested
      // editors (e.g. image caption) should unmount without affecting it
      if (editor._parentEditor == null) {
        collabContext.isCollabActive = false
      }
    }
  }, [collabContext, editor])

  const provider = useMemo(() => providerFactory(id, yjsDocMap), [id, providerFactory, yjsDocMap])

  const binding = useYjsCollaboration(
    editor,
    id,
    provider,
    yjsDocMap,
    name,
    color,
    onLoadResult,
    cursorsContainer,
    editorInitializationConfig,
    additionalAwarenessData,
  )

  collabContext.clientID = binding.clientID

  const undoManager = useYjsHistory(editor, binding)
  collabContext.undoManager = undoManager
  useYjsFocusTracking(editor, provider, name, color, additionalAwarenessData)
  useScrollToUserCursorOnEvent(binding)

  return null
}
