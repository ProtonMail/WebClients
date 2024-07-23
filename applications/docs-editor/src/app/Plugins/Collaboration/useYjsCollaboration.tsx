import type { Binding, ExcludedProperties, Provider } from '@lexical/yjs'
import type { LexicalEditor } from 'lexical'

import {
  createBinding,
  initLocalState,
  syncCursorPositions,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
} from '@lexical/yjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Doc, Transaction, YEvent } from 'yjs'
import { UndoManager } from 'yjs'

import type { EditorInitializationConfig } from '@proton/docs-shared'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { initializeEditorAccordingToConfigIfRootIsEmpty } from './initializeEditor'

export type CursorsContainerRef = React.MutableRefObject<HTMLElement | null>

// Original: https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/shared/useYjsCollaboration.tsx

export function useYjsCollaboration(
  editor: LexicalEditor,
  id: string,
  provider: Provider,
  docMap: Map<string, Doc>,
  name: string,
  color: string,
  shouldBootstrap: boolean,
  onCollabReady: () => void,
  cursorsContainerRef?: CursorsContainerRef,
  editorInitializationConfig?: EditorInitializationConfig,
  excludedProperties?: ExcludedProperties,
  awarenessData?: object,
): [JSX.Element, Binding] {
  const [doc] = useState(() => docMap.get(id))
  const didPostReadyEvent = useRef(false)
  const didInitializeEditor = useRef(false)

  const binding = useMemo(
    () => createBinding(editor, provider, id, doc, docMap, excludedProperties),
    [editor, provider, id, docMap, doc, excludedProperties],
  )

  useEffect(() => {
    const { root } = binding
    const { awareness } = provider

    const onAwarenessUpdate = () => {
      syncCursorPositions(binding, provider)
    }

    const onYjsTreeChanges = (
      // The below `any` type is taken directly from the vendor types for YJS.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: YEvent<any>[],
      transaction: Transaction,
    ) => {
      const origin = transaction.origin
      if (origin !== binding) {
        const isFromUndoManger = origin instanceof UndoManager
        syncYjsChangesToLexical(binding, provider, events, isFromUndoManger)
      }
    }

    initLocalState(provider, name, color, document.activeElement === editor.getRootElement(), awarenessData || {})

    const onWindowResize = () => {
      syncCursorPositions(binding, provider)
    }

    awareness.on('update', onAwarenessUpdate)

    // This updates the local editor state when we recieve updates from other clients
    root.getSharedType().observeDeep(onYjsTreeChanges)

    const removeListener = editor.registerUpdateListener(
      ({ prevEditorState, editorState, dirtyLeaves, dirtyElements, normalizedNodes, tags }) => {
        if (tags.has('skip-collab') === false) {
          syncLexicalUpdateToYjs(
            binding,
            provider,
            prevEditorState,
            editorState,
            dirtyElements,
            dirtyLeaves,
            normalizedNodes,
            tags,
          )
        }
      },
    )

    window.addEventListener('resize', onWindowResize)

    if (!didPostReadyEvent.current) {
      onCollabReady()
      if (editorInitializationConfig && !didInitializeEditor.current) {
        initializeEditorAccordingToConfigIfRootIsEmpty(editor, binding, editorInitializationConfig)
          .then(() => {
            didInitializeEditor.current = true
          })
          .catch(sendErrorMessage)
      }
      didPostReadyEvent.current = true
    }

    return () => {
      awareness.off('update', onAwarenessUpdate)
      root.getSharedType().unobserveDeep(onYjsTreeChanges)
      docMap.delete(id)
      removeListener()
      window.removeEventListener('resize', onWindowResize)
    }
  }, [
    binding,
    color,
    docMap,
    editor,
    id,
    editorInitializationConfig,
    name,
    provider,
    shouldBootstrap,
    awarenessData,
    onCollabReady,
  ])

  const cursorsContainer = useMemo(() => {
    let rootElementContainer: HTMLElement | null = null

    const onContainerScroll = () => {
      syncCursorPositions(binding, provider)
    }

    const ref = (element: null | HTMLElement) => {
      if (element) {
        rootElementContainer = editor.getRootElement()!.parentElement
        if (rootElementContainer) {
          rootElementContainer.addEventListener('scroll', onContainerScroll)
        }
      } else {
        if (rootElementContainer) {
          rootElementContainer.removeEventListener('scroll', onContainerScroll)
        }
      }
      binding.cursorsContainer = element
    }

    return createPortal(
      <div className="Lexical__cursorsContainer" ref={ref} />,
      (cursorsContainerRef && cursorsContainerRef.current) || document.body,
    )
  }, [binding, cursorsContainerRef, editor, provider])

  return [cursorsContainer, binding]
}
