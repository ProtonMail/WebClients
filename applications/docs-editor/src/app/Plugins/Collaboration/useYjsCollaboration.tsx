import type { Binding, ExcludedProperties, Provider } from '@lexical/yjs'
import type { LexicalEditor } from 'lexical'

import { mergeRegister } from '@lexical/utils'
import {
  createBinding,
  createUndoManager,
  initLocalState,
  setLocalStateFocus,
  syncCursorPositions,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
} from '@lexical/yjs'
import {
  BLUR_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  FOCUS_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Doc, Transaction, UndoManager, YEvent } from 'yjs'

import { FileToDocPendingConversion } from '@proton/docs-shared'
import { $importDataIntoEditor } from '../../Conversion/ImportDataIntoEditor'
import { sendErrorMessage } from '../../Utils/errorMessage'

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
  injectWithNewContent?: FileToDocPendingConversion,
  excludedProperties?: ExcludedProperties,
  awarenessData?: object,
): [JSX.Element, Binding] {
  const [doc] = useState(() => docMap.get(id))
  const didPostReadyEvent = React.useRef(false)

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
      if (root.isEmpty() && root._xmlText.length === 0 && injectWithNewContent) {
        $importDataIntoEditor(editor, injectWithNewContent.data, injectWithNewContent.type).catch(sendErrorMessage)
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
    injectWithNewContent,
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

export function useYjsFocusTracking(
  editor: LexicalEditor,
  provider: Provider,
  name: string,
  color: string,
  awarenessData?: object,
) {
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setLocalStateFocus(provider, name, color, true, awarenessData || {})
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setLocalStateFocus(provider, name, color, false, awarenessData || {})
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [color, editor, name, provider, awarenessData])
}

export function useYjsHistory(editor: LexicalEditor, binding: Binding): () => void {
  const undoManager = useMemo(() => createUndoManager(binding, binding.root.getSharedType()), [binding])

  useEffect(() => {
    const undo = () => {
      undoManager.undo()
    }

    const redo = () => {
      undoManager.redo()
    }

    return mergeRegister(
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          undo()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          redo()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  })
  const clearHistory = useCallback(() => {
    undoManager.clear()
  }, [undoManager])

  // Exposing undo and redo states
  React.useEffect(() => {
    const updateUndoRedoStates = () => {
      editor.dispatchCommand(CAN_UNDO_COMMAND, undoManager.undoStack.length > 0)
      editor.dispatchCommand(CAN_REDO_COMMAND, undoManager.redoStack.length > 0)
    }
    undoManager.on('stack-item-added', updateUndoRedoStates)
    undoManager.on('stack-item-popped', updateUndoRedoStates)
    undoManager.on('stack-cleared', updateUndoRedoStates)
    return () => {
      undoManager.off('stack-item-added', updateUndoRedoStates)
      undoManager.off('stack-item-popped', updateUndoRedoStates)
      undoManager.off('stack-cleared', updateUndoRedoStates)
    }
  }, [editor, undoManager])

  return clearHistory
}
