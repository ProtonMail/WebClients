import type { Binding, Provider } from '@lexical/yjs'
import { $getRoot, type LexicalEditor } from 'lexical'

import { createBinding, initLocalState, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from '@lexical/yjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Doc, Transaction, YEvent } from 'yjs'
import { UndoManager } from 'yjs'

import { TranslatedResult } from '@proton/docs-shared'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import type { LoggerInterface } from '@proton/utils/logs'

/**
 * Based on useYjsCollaboration, but without awareness and cursors, and the addition of Safe Mode.
 */
export function useYjsReadonly(
  editor: LexicalEditor,
  id: string,
  provider: Provider,
  docMap: Map<string, Doc>,
  onLoadResult: EditorLoadResult,
  logger: LoggerInterface,
  safeMode?: boolean,
  lexicalError?: Error,
): Binding {
  const [doc] = useState(() => docMap.get(id))
  const didPostReadyEvent = useRef(false)

  const safeModeEventIndex = useRef(-1)
  const needsDecrementDeltaArray = useRef(false)
  const lastSyncedEvents = useRef<YEvent<any>[]>()

  const binding = useMemo(
    () => createBinding(editor, provider, id, doc, docMap, undefined),
    [editor, provider, id, docMap, doc],
  )

  const applyEventsBasedOnCurrentIndices = useCallback(
    (isFromUndoManager: boolean) => {
      if (safeModeEventIndex.current < 0) {
        logger.info('Safe mode event index is less than 0. Not applying events.')
        return
      }

      const events = lastSyncedEvents.current!.slice(0, safeModeEventIndex.current + 1)

      if (needsDecrementDeltaArray.current) {
        const event = events[events.length - 1]
        event._delta = event.delta.slice(0, -1)
        needsDecrementDeltaArray.current = false
      }

      logger.info(
        `Applying ${events.length} events to lexical. Current event deltas: ${events[events.length - 1]?.delta?.length}. Safe mode: ${safeMode}`,
      )

      syncYjsChangesToLexical(binding, provider, events, isFromUndoManager)
    },
    [binding, logger, provider, safeMode],
  )

  useEffect(() => {
    /**
     * If we receive a lexical error and we are in safe mode, we will begin trying to render as many updates as we can
     * until we receive a new error. This allows us to eventually exclude the delta that may be causing the error.
     *
     * For now, safe mode is only activated when viewing a revision.
     *
     * Each time we receive a new error, we will set needsDecrementDeltaIndex to true re-sync to lexical.
     * The reason we don't use an index but rather a bool is that we modify the current event's delta in place,
     * as I wasn't able to conveniently find a way to make a copy of an event and its deltas.
     *
     * Each time we resync, we mutate the current event's delta to exclude the last delta, in place.
     *
     * If we try all deltas of the current event, we now decrement the event index.
     *
     */
    if (lexicalError && safeMode) {
      logger.info('Lexical is in safe mode. Attempting to reset editor state and apply one less delta.')

      /** Clear the editor first as we will be reapplying all state. */
      editor.update(
        () => {
          const root = $getRoot()
          root.clear()
        },
        {
          onUpdate: () => {
            if (!lastSyncedEvents.current) {
              return
            }

            const currentEvent = lastSyncedEvents.current[safeModeEventIndex.current]
            if (currentEvent.delta.length > 1) {
              needsDecrementDeltaArray.current = true
            } else {
              safeModeEventIndex.current -= 1
            }

            applyEventsBasedOnCurrentIndices(false)
          },
        },
      )
    }
  }, [lexicalError, binding, safeMode, provider, editor, applyEventsBasedOnCurrentIndices, logger])

  useEffect(() => {
    const { root } = binding

    const onYjsTreeChanges = (
      // The below `any` type is taken directly from the vendor types for YJS.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: YEvent<any>[],
      transaction: Transaction,
    ) => {
      const origin = transaction.origin
      if (origin !== binding) {
        const isFromUndoManger = origin instanceof UndoManager

        lastSyncedEvents.current = events
        safeModeEventIndex.current = events.length - 1

        applyEventsBasedOnCurrentIndices(isFromUndoManger)
      }
    }

    initLocalState(provider, '', '', document.activeElement === editor.getRootElement(), {})

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

    if (!didPostReadyEvent.current) {
      onLoadResult(TranslatedResult.ok())
      didPostReadyEvent.current = true
    }

    return () => {
      root.getSharedType().unobserveDeep(onYjsTreeChanges)
      docMap.delete(id)
      removeListener()
    }
  }, [applyEventsBasedOnCurrentIndices, binding, docMap, editor, id, onLoadResult, provider])

  return binding
}
