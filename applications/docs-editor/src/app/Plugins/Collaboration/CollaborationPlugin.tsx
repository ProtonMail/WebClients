import type { Doc } from 'yjs'

import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { ExcludedProperties, Provider } from '@lexical/yjs'
import { useEffect, useMemo } from 'react'

import type { CursorsContainerRef } from './useYjsCollaboration'
import { useYjsCollaboration } from './useYjsCollaboration'
import { useYjsHistory } from './useYjsHistory'
import type { EditorInitializationConfig } from '@proton/docs-shared'
import { useYjsFocusTracking } from './useYjsFocusTracking'

type Props = {
  id: string
  providerFactory: (
    // eslint-disable-next-line no-shadow
    id: string,
    yjsDocMap: Map<string, Doc>,
  ) => Provider
  shouldBootstrap: boolean
  onCollabReady: () => void
  username?: string
  cursorColor?: string
  cursorsContainerRef?: CursorsContainerRef
  editorInitializationConfig: EditorInitializationConfig | undefined
  excludedProperties?: ExcludedProperties
  // `awarenessData` parameter allows arbitrary data to be added to the awareness.
  awarenessData?: object
}

export function CollaborationPlugin({
  id,
  providerFactory,
  shouldBootstrap,
  onCollabReady,
  username,
  cursorColor,
  cursorsContainerRef,
  editorInitializationConfig,
  excludedProperties,
  awarenessData,
}: Props): JSX.Element {
  const collabContext = useCollaborationContext(username, cursorColor)

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
    shouldBootstrap,
    onCollabReady,
    cursorsContainerRef,
    editorInitializationConfig,
    excludedProperties,
    awarenessData,
  )

  collabContext.clientID = binding.clientID

  useYjsHistory(editor, binding)
  useYjsFocusTracking(editor, provider, name, color, awarenessData)

  return cursors
}
