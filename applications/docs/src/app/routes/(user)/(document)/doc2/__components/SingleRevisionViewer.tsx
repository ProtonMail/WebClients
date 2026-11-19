import { useCallback, useEffect, useRef, useState } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'
import { EditorSystemMode } from '@proton/docs-shared/EditorSystemMode'
import type { YjsState } from '@proton/docs-shared/YjsState'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { FeatureFlag } from '@proton/unleash/Flags'
import { useFlag } from '@proton/unleash/useFlag'
import { c } from 'ttag'

import { EditorFrame } from '~/components/document/EditorFrame'
import { useApplication } from '~/utils/application-context'

import { ClientEditorBridge } from '../__utils/ClientEditorBridge'
import type { EditorInvoker } from '../__utils/EditorInvoker'
import type { ClientHandler } from '../__utils/createClientHandler'
import { useIsEditorDarkMode } from '../__utils/useEditorBasics'

export type SingleRevisionViewerProps = {
  /** The Revision's state: its History Log entries and every earlier one, merged */
  state: YjsState
  onEditorInvokerRef: (editorInvoker: EditorInvoker) => void
}

/**
 * The calls a revision view answers: which editor to load, and its errors. It sends nothing, as the editor in
 * `EditorSystemMode.Revision` propagates no update and no presence; other calls get no reply. Adapted from
 * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/HistoryViewerModal/SingleRevisionViewer.tsx`,
 * the orchestrator it hands its bridge.
 */
export function createRevisionClientHandler({
  isSheetsMountAfterInitialLoadDisabled,
  onIrrecoverableError,
  logger,
}: {
  isSheetsMountAfterInitialLoadDisabled: boolean
  onIrrecoverableError: () => void
  logger: LoggerInterface
}): Partial<ClientHandler> {
  return {
    checkIfFeatureFlagIsEnabled: async (featureFlag: FeatureFlag) =>
      featureFlag === 'SheetsMountAfterInitialLoadDisabled' && isSheetsMountAfterInitialLoadDisabled,
    reportUserInterfaceError: async (_error, extraInfo) => {
      // Not `logger.error`, which sends its arguments to Sentry: the editor's message may quote document content.
      logger.warn('Revision editor reported an error', { irrecoverable: Boolean(extraInfo?.irrecoverable) })
      if (extraInfo?.irrecoverable) {
        onIrrecoverableError()
      }
    },
  }
}

/**
 * A read-only view of one Revision, in a second editor frame of its own. Copied from
 * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/HistoryViewerModal/SingleRevisionViewer.tsx`,
 * on doc2's bridge and for text documents only. The bridge goes when the view does.
 */
export function SingleRevisionViewer({ state, onEditorInvokerRef }: SingleRevisionViewerProps) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const isDarkMode = useIsEditorDarkMode()
  const [editorInvoker, setEditorInvoker] = useState<EditorInvoker | null>(null)
  /** Set when the editor reports it cannot show this version, such as when its code fails to load. */
  const [hasIrrecoverableError, setHasIrrecoverableError] = useState(false)
  const isSheetsMountAfterInitialLoadDisabled = useFlag('SheetsMountAfterInitialLoadDisabled')
  const bridgeRef = useRef<ClientEditorBridge | null>(null)

  useEffect(() => () => bridgeRef.current?.destroy(), [])

  useEffect(() => {
    if (editorInvoker) {
      void editorInvoker.setDarkMode(isDarkMode)
    }
  }, [editorInvoker, isDarkMode])
  const onFrameReady = useCallback(
    async (frame: HTMLIFrameElement) => {
      const clientHandler = createRevisionClientHandler({
        isSheetsMountAfterInitialLoadDisabled,
        onIrrecoverableError: () => setHasIrrecoverableError(true),
        logger,
      })

      const bridge = new ClientEditorBridge(frame, clientHandler, logger)
      bridgeRef.current = bridge

      const newEditorInvoker = bridge.editorInvoker
      setEditorInvoker(newEditorInvoker)

      newEditorInvoker
        .initializeEditor('DummyDocumentId', 'DummyUserAddress', 'Viewer', false, APP_VERSION)
        .catch(console.error)

      newEditorInvoker
        .receiveMessage({
          content: state,
          type: {
            wrapper: 'du',
          },
        })
        .catch(console.error)

      newEditorInvoker
        .receiveMessage({
          type: {
            wrapper: 'events',
            eventType: EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas,
          },
          content: new Uint8Array(),
        })
        .catch(console.error)

      newEditorInvoker.showEditor().catch(console.error)

      onEditorInvokerRef(newEditorInvoker)
    },
    [APP_VERSION, isSheetsMountAfterInitialLoadDisabled, logger, onEditorInvokerRef, state],
  )

  if (hasIrrecoverableError) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-[--text-weak]" role="alert">
        {c('Error').t`This version could not be loaded. Close the history and try again.`}
      </div>
    )
  }

  return (
    <EditorFrame
      systemMode={EditorSystemMode.Revision}
      onFrameReady={onFrameReady}
      logger={logger}
      isDarkMode={isDarkMode}
    />
  )
}
