import type { Doc } from 'yjs'

import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { Provider } from '@lexical/yjs'
import { useEffect, useMemo } from 'react'

import { useYjsCollaboration } from './useYjsCollaboration'
import { useYjsHistory } from './useYjsHistory'
import type { EditorInitializationConfig } from '@proton/docs-shared'
import { useYjsFocusTracking } from './useYjsFocusTracking'
import type { EditorLoadResult } from '../../EditorLoadResult'

type Props = {
  id: string
  providerFactory: (
    // eslint-disable-next-line no-shadow
    id: string,
    yjsDocMap: Map<string, Doc>,
  ) => Provider
  shouldBootstrap: boolean
  onLoadResult: EditorLoadResult
  editorInitializationConfig: EditorInitializationConfig | undefined
}

export function CollaborationPlugin({
  id,
  providerFactory,
  onLoadResult,
  editorInitializationConfig,
}: Props): JSX.Element {
  const collabContext = useCollaborationContext()

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

  const [cursors, binding] = useYjsCollaboration(
    editor,
    id,
    provider,
    yjsDocMap,
    name,
    color,
    onLoadResult,
    editorInitializationConfig,
  )

  collabContext.clientID = binding.clientID

  useYjsHistory(editor, binding)
  useYjsFocusTracking(editor, provider, name, color)

  return cursors
}
