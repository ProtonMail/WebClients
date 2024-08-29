import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  DocsClientSquashVerificationObjectionMadePayload,
  EditorOrchestratorInterface,
  GeneralUserDisplayableErrorOccurredPayload,
  WebsocketConnectionEventPayloads,
} from '@proton/docs-core'
import {
  ClientToEditorBridge,
  DocControllerEvent,
  ApplicationEvent,
  SquashVerificationObjectionDecision,
  WebsocketConnectionEvent,
} from '@proton/docs-core'
import { Button, CircleLoader } from '@proton/atoms'
import DebugMenu, { useDebug } from './DebugMenu'
import { useApplication } from '../Containers/ApplicationProvider'
import type {
  CommentMarkNodeChangeData,
  EditorInitializationConfig,
  LiveCommentsTypeStatusChangeData,
} from '@proton/docs-shared'
import { CommentsEvent, LiveCommentsEvent } from '@proton/docs-shared'
import { EditorFrame } from './EditorFrame'
import { mergeRegister } from '@lexical/utils'
import { useSignatureCheckFailedModal } from './Modals/SignatureCheckFailedModal'
import type { DocumentAction, NodeMeta } from '@proton/drive-store'
import { c } from 'ttag'
import { useGenericAlertModal } from './Modals/GenericAlert'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { Availability, AvailabilityTypes } from '@proton/utils/availability'
import { useAuthentication } from '@proton/components/hooks'
import { useGetUserSettings } from '@proton/components/hooks/useUserSettings'
import WordCountOverlay from './WordCount/WordCountOverlay'
import metrics from '@proton/metrics'

type Props = {
  lookup: NodeMeta
  editorInitializationConfig?: EditorInitializationConfig
  action: DocumentAction['mode'] | undefined
}

type Error = {
  message: string
  userUnderstandableMessage: boolean
}

export function DocumentViewer({ lookup, editorInitializationConfig, action }: Props) {
  const application = useApplication()
  const { getLocalID } = useAuthentication()

  const [signatureFailedModal, openSignatureFailedModal] = useSignatureCheckFailedModal()
  const isSignatureFailedModalOpen = useRef(false)
  const [hasSignatureIssues, setHasSignatureIssues] = useState(false)

  const [genericAlertModal, showGenericAlertModal] = useGenericAlertModal()

  const [editorFrame, setEditorFrame] = useState<HTMLIFrameElement | null>(null)
  const [docOrchestrator, setDocOrchestrator] = useState<EditorOrchestratorInterface | null>(null)
  const [bridge, setBridge] = useState<ClientToEditorBridge | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [didLoadTitle, setDidLoadTitle] = useState(false)
  const [didLoadEditorContent, setDidLoadEditorContent] = useState(false)
  const debug = useDebug()
  const getUserSettings = useGetUserSettings()

  useEffect(() => {
    if (action === 'download' && didLoadTitle && didLoadEditorContent && docOrchestrator) {
      void docOrchestrator.exportAndDownload('docx')
    }
  }, [action, docOrchestrator, didLoadTitle, didLoadEditorContent])

  useEffect(() => {
    if (!bridge) {
      return
    }

    void getUserSettings().then((settings) => {
      void bridge.editorInvoker.loadUserSettings(settings)
    })
  }, [bridge, getUserSettings])

  useEffect(() => {
    if (!bridge) {
      return
    }

    return application.eventBus.addEventCallback(() => {
      void bridge.editorInvoker.handleCommentsChange()
    }, CommentsEvent.CommentsChanged)
  }, [application.eventBus, bridge])

  useEffect(() => {
    return application.eventBus.addEventCallback(() => {
      setDidLoadTitle(true)
    }, DocControllerEvent.DidLoadDocumentTitle)
  }, [application.eventBus])

  useEffect(() => {
    return application.eventBus.addEventCallback(() => {
      setDidLoadEditorContent(true)
    }, DocControllerEvent.DidLoadInitialEditorContent)
  }, [application.eventBus])

  useEffect(() => {
    return application.eventBus.addEventCallback(() => {
      setHasSignatureIssues(true)
    }, DocControllerEvent.SquashVerificationObjectionDecisionRequired)
  }, [application.eventBus])

  useEffect(() => {
    return application.eventBus.addEventCallback(() => {
      showGenericAlertModal({
        title: c('Title').t`Your document cannot be loaded`,
        translatedMessage: c('Info')
          .t`Please export a copy of your current changes from the main menu and reload the page.`,
      })
    }, DocControllerEvent.UnableToResolveCommitIdConflict)
  }, [application.eventBus, showGenericAlertModal])

  useEffect(() => {
    return application.eventBus.addEventCallback<GeneralUserDisplayableErrorOccurredPayload>(
      (payload: GeneralUserDisplayableErrorOccurredPayload) => {
        if (payload.irrecoverable) {
          setError({ message: payload.translatedError, userUnderstandableMessage: true })
          metrics.docs_alert_modal_total.increment({})
          application.destroy()
          Availability.mark(AvailabilityTypes.CRITICAL)
        } else {
          showGenericAlertModal({
            title: payload.translatedErrorTitle || c('Title').t`Something went wrong`,
            translatedMessage: payload.translatedError,
            onClose: payload.onClose,
          })
        }
      },
      ApplicationEvent.GeneralUserDisplayableErrorOccurred,
    )
  }, [application, application.eventBus, showGenericAlertModal])

  useEffect(() => {
    return application.eventBus.addEventCallback(
      (payload: WebsocketConnectionEventPayloads[WebsocketConnectionEvent.EncryptionError]) => {
        showGenericAlertModal({
          title: c('Title').t`Something went wrong`,
          translatedMessage: payload.error,
        })
      },
      WebsocketConnectionEvent.EncryptionError,
    )
  }, [application.eventBus, showGenericAlertModal])

  const showFailedSignatureModal = useCallback(() => {
    isSignatureFailedModalOpen.current = true
    openSignatureFailedModal({
      ignore: () => {
        isSignatureFailedModalOpen.current = false
        const payload: DocsClientSquashVerificationObjectionMadePayload = {
          decision: SquashVerificationObjectionDecision.AbortSquash,
        }
        application.eventBus.publish({
          type: ApplicationEvent.SquashVerificationObjectionDecisionMade,
          payload,
        })
      },
      accept: () => {
        setHasSignatureIssues(false)
        isSignatureFailedModalOpen.current = false

        const payload: DocsClientSquashVerificationObjectionMadePayload = {
          decision: SquashVerificationObjectionDecision.ContinueSquash,
        }
        application.eventBus.publish({
          type: ApplicationEvent.SquashVerificationObjectionDecisionMade,
          payload,
        })
      },
    })
  }, [application.eventBus, openSignatureFailedModal])

  useEffect(() => {
    if (isSignatureFailedModalOpen.current || !hasSignatureIssues) {
      return
    }

    showFailedSignatureModal()
  }, [hasSignatureIssues, showFailedSignatureModal])

  useEffect(() => {
    if (!bridge) {
      return
    }

    return mergeRegister(
      application.eventBus.addEventCallback((data: LiveCommentsTypeStatusChangeData) => {
        void bridge.editorInvoker.handleTypingStatusChange(data.threadId)
      }, LiveCommentsEvent.TypingStatusChange),

      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        void bridge.editorInvoker.handleCreateCommentMarkNode(data.markID)
      }, CommentsEvent.CreateMarkNode),

      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        void bridge.editorInvoker.handleRemoveCommentMarkNode(data.markID)
      }, CommentsEvent.RemoveMarkNode),

      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        void bridge.editorInvoker.handleResolveCommentMarkNode(data.markID)
      }, CommentsEvent.ResolveMarkNode),

      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        void bridge.editorInvoker.handleUnresolveCommentMarkNode(data.markID)
      }, CommentsEvent.UnresolveMarkNode),
    )
  }, [application.eventBus, bridge])

  const createBridge = useCallback(
    (orchestrator: EditorOrchestratorInterface, editorFrame: HTMLIFrameElement) => {
      if (bridge) {
        application.logger.warn('Attempting to create bridge when one already exists')
        return
      }

      application.logger.info('Creating bridge from client to editor')

      const clientToEditorBridge = new ClientToEditorBridge(editorFrame, orchestrator, application.eventBus)

      setBridge(clientToEditorBridge)

      void clientToEditorBridge.editorInvoker.initializeEditor(
        orchestrator.docMeta.uniqueIdentifier,
        orchestrator.username,
        orchestrator.role.roleType,
        editorInitializationConfig,
      )
    },
    [application.logger, application.eventBus, editorInitializationConfig, bridge],
  )

  const onFrameReady = useCallback(
    (frame: HTMLIFrameElement) => {
      setEditorFrame(frame)

      if (docOrchestrator && !bridge) {
        createBridge(docOrchestrator, frame)
      }
    },
    [docOrchestrator, createBridge, bridge],
  )

  useEffect(() => {
    if (docOrchestrator) {
      return
    }

    const disposer = application.docLoader.addStatusObserver({
      onSuccess: (orchestrator) => {
        setDocOrchestrator(orchestrator)
        setReady(true)

        if (editorFrame && !bridge) {
          createBridge(orchestrator, editorFrame)
        }
      },
      onError: (errorMessage) => {
        setError({ message: errorMessage, userUnderstandableMessage: false })
      },
    })

    if (!initializing) {
      setInitializing(true)

      void application.docLoader.initialize(lookup)
    }

    return disposer
  }, [application, lookup, docOrchestrator, editorFrame, createBridge, initializing, bridge])

  if (error) {
    return (
      <div className="flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center">
        <h1 className="text-lg font-bold">{c('Info').t`Something went wrong`}</h1>
        <div className="mt-1 max-w-lg whitespace-pre-line text-center">
          {error.userUnderstandableMessage
            ? error.message
            : c('Info')
                .t`This document may not exist, or you may not have permission to view it. You may try reloading the page to see if the issue persists.`}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => window.open(getAppHref('/', APPS.PROTONDOCS, getLocalID()), '_blank')}>
            {c('Action').t`Create new document`}
          </Button>
          <Button color="norm" onClick={() => window.open(getAppHref('/', APPS.PROTONDRIVE, getLocalID()), '_blank')}>
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {ready && debug && <DebugMenu docController={application.docLoader.getDocController()} />}
      {ready && <WordCountOverlay />}
      {!docOrchestrator && (
        <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
          <CircleLoader size="large" />
          <div className="text-center">{c('Info').t`Loading document...`}</div>
        </div>
      )}

      <EditorFrame key="docs-editor-iframe" onFrameReady={onFrameReady} />
      {signatureFailedModal}
      {genericAlertModal}
    </div>
  )
}
