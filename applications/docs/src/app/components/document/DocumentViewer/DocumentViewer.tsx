import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AuthenticatedDocControllerInterface,
  DocsClientSquashVerificationObjectionMadePayload,
  DocumentState,
  EditorOrchestratorInterface,
  GeneralUserDisplayableErrorOccurredPayload,
  PublicDocumentState,
  WebsocketConnectionEventPayloads,
} from '@proton/docs-core'
import {
  ClientToEditorBridge,
  DocControllerEvent,
  ApplicationEvent,
  SquashVerificationObjectionDecision,
  WebsocketConnectionEvent,
  isLocalEnvironment,
  isDocumentState,
} from '@proton/docs-core'
import { CircleLoader } from '@proton/atoms'
import { DebugMenu, useDebug } from './DebugMenu'
import { useApplication } from '../../../Containers/ApplicationProvider'
import type {
  CommentMarkNodeChangeData,
  EditorInitializationConfig,
  LiveCommentsTypeStatusChangeData,
} from '@proton/docs-shared'
import { CommentsEvent, EditorEvent, EditorSystemMode, LiveCommentsEvent } from '@proton/docs-shared'
import { EditorFrame } from '../EditorFrame'
import { mergeRegister } from '@lexical/utils'
import { useSignatureCheckFailedModal } from './SignatureCheckFailedModal'
import { isPrivateNodeMeta, type DocumentAction, type NodeMeta, type PublicNodeMeta } from '@proton/drive-store'
import { c } from 'ttag'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import { Availability, AvailabilityTypes } from '@proton/utils/availability'
import { useGetUserSettings } from '@proton/account/userSettings/hooks'
import { WordCountOverlay } from '../WordCount'
import { useSuggestionsFeatureFlag } from '../../../Hooks/useSuggestionsFeatureFlag'
import { useWelcomeSplashModal } from '../public/WelcomeSplashModal'
import type { EditorControllerInterface } from '@proton/docs-core'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { InviteAutoAccepter } from './InviteAutoAccepter'
import { type DocumentError, DocumentErrorFallback } from './DocumentErrorFallback'
import { AppendPublicShareKeyMaterialToTitle } from '../../../Hooks/AppendPublicShareUrlKeyMaterial'

export type DocumentViewerProps = {
  nodeMeta: NodeMeta | PublicNodeMeta
  editorInitializationConfig?: EditorInitializationConfig
  action: DocumentAction['mode'] | undefined
}

export function DocumentViewer({ nodeMeta, editorInitializationConfig, action }: DocumentViewerProps) {
  const application = useApplication()
  const getUserSettings = useGetUserSettings()
  const debug = useDebug()

  const [documentState, setDocumentState] = useState<DocumentState | PublicDocumentState | null>(null)
  const [docController, setDocController] = useState<AuthenticatedDocControllerInterface | undefined>(undefined)
  const [editorController, setEditorController] = useState<EditorControllerInterface | null>(null)

  const [signatureFailedModal, openSignatureFailedModal] = useSignatureCheckFailedModal()
  const isSignatureFailedModalOpen = useRef(false)
  const [hasSignatureIssues, setHasSignatureIssues] = useState(false)

  const [publicSplashModal, openPublicSplashModal] = useWelcomeSplashModal()
  const [genericAlertModal, showGenericAlertModal] = useGenericAlertModal()

  const [editorFrame, setEditorFrame] = useState<HTMLIFrameElement | null>(null)
  const [docOrchestrator, setDocOrchestrator] = useState<EditorOrchestratorInterface | null>(null)
  const [bridge, setBridge] = useState<ClientToEditorBridge | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<DocumentError | null>(null)
  const [didLoadTitle, setDidLoadTitle] = useState(false)
  const [didLoadEditorContent, setDidLoadEditorContent] = useState(false)
  /**
   * If a document fails to laod with insufficient permissions, we try to see if there's a pending invite for it
   * and autoaccept it, before showing any error state to the user.
   */
  const [didAttemptToAutoAcceptInvite, setDidAttemptToAutoAcceptInvite] = useState(false)

  const isPublicViewer = useMemo(() => documentState?.getProperty('userRole').isPublicViewer(), [documentState])
  /**
   * The editor is not allowed to change its url or systemMode after initial mount.
   * In public mode, we don't know whether the user has edit permissions until we fetch the node.
   * In private mode, we know the user's role immediately so don't have to wait for the userRole property to settle.
   */
  const renderEditor = !application.isPublicMode ? true : isPublicViewer != undefined

  const { isSuggestionsEnabled } = useSuggestionsFeatureFlag()
  useEffect(() => {
    application.syncedEditorState.setProperty('suggestionsEnabled', isSuggestionsEnabled || isLocalEnvironment())
  }, [application.syncedEditorState, isSuggestionsEnabled])

  const isDownloadAction = action === 'download' || action === 'open-url-download'
  useEffect(() => {
    if (isDownloadAction && didLoadTitle && didLoadEditorContent && docOrchestrator) {
      void docOrchestrator.exportAndDownload('docx')
    }
  }, [docOrchestrator, didLoadTitle, didLoadEditorContent, isDownloadAction])

  useEffect(() => {
    if (!bridge) {
      return
    }

    if (documentState?.getProperty('userRole').isPublicViewerOrEditor()) {
      return
    }

    void getUserSettings().then((settings) => {
      void bridge.editorInvoker.loadUserSettings(settings)
    })
  }, [bridge, getUserSettings, documentState])

  useEffect(() => {
    if (!bridge) {
      return
    }

    return application.eventBus.addEventCallback(() => {
      void bridge.editorInvoker.handleCommentsChange()
    }, CommentsEvent.CommentsChanged)
  }, [application.eventBus, bridge])

  useEffect(() => {
    return documentState?.subscribeToProperty('documentName', (title) => {
      setDidLoadTitle(true)
    })
  }, [documentState])

  useEffect(() => {
    return documentState?.subscribeToEvent('EditorIsReadyToBeShown', () => {
      setDidLoadEditorContent(true)
    })
  }, [documentState])

  useEffect(() => {
    return application.eventBus.addEventCallback(() => {
      setHasSignatureIssues(true)
    }, DocControllerEvent.SquashVerificationObjectionDecisionRequired)
  }, [application.eventBus])

  useEffect(() => {
    return application.eventBus.addEventCallback(() => {
      if (isPublicViewer && editorController && documentState) {
        openPublicSplashModal({ editorController, documentState: documentState as PublicDocumentState })
      }
    }, EditorEvent.ToolbarClicked)
  }, [application.eventBus, isPublicViewer, openPublicSplashModal, editorController, documentState])

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
          application.metrics.reportFullyBlockingErrorModal()
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
    (
      orchestrator: EditorOrchestratorInterface,
      editorFrame: HTMLIFrameElement,
      editorController: EditorControllerInterface,
    ) => {
      if (bridge) {
        application.logger.warn('Attempting to create bridge when one already exists')
        return
      }

      if (!documentState) {
        throw new Error('Document state not yet available')
      }

      application.logger.info('Creating bridge from client to editor')

      const clientToEditorBridge = new ClientToEditorBridge(
        editorFrame,
        orchestrator,
        application.eventBus,
        application.syncedEditorState,
      )

      setBridge(clientToEditorBridge)

      void editorController.initializeEditor(editorInitializationConfig, orchestrator.userAddress)
    },
    [
      bridge,
      documentState,
      application.logger,
      application.eventBus,
      application.syncedEditorState,
      editorInitializationConfig,
    ],
  )

  const onFrameReady = useCallback(
    (frame: HTMLIFrameElement) => {
      setEditorFrame(frame)

      application.logger.info('Editor frame ready')
    },
    [application.logger],
  )

  useEffect(() => {
    if (docOrchestrator) {
      return
    }

    const disposer = application.getDocLoader().addStatusObserver({
      onSuccess: (result) => {
        setDocumentState(result.documentState)
        setDocOrchestrator(result.orchestrator)
        setDocController(result.docController)
        setEditorController(result.editorController)
        setReady(true)
      },
      onError: (errorMessage, code) => {
        setError({ message: errorMessage, userUnderstandableMessage: false, code })
        application.metrics.reportFullyBlockingErrorModal()
      },
    })

    if (!initializing) {
      setInitializing(true)

      void application.getDocLoader().initialize(nodeMeta)
    }

    return disposer
  }, [application, docOrchestrator, initializing, nodeMeta])

  useEffect(() => {
    if (docOrchestrator && editorFrame && editorController && !bridge) {
      createBridge(docOrchestrator, editorFrame, editorController)
    }
  }, [docOrchestrator, editorFrame, createBridge, bridge, editorController])

  const onInviteAutoAcceptResult = useCallback((result: boolean) => {
    if (result) {
      window.location.reload()
    }

    setDidAttemptToAutoAcceptInvite(true)
  }, [])

  const Loader = (
    <div className="relative h-full w-full">
      <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
        <div className="text-center">{c('Info').t`Loading document...`}</div>
      </div>
    </div>
  )

  if (
    error &&
    error.code === DocsApiErrorCode.InsufficientPermissions &&
    isPrivateNodeMeta(nodeMeta) &&
    !didAttemptToAutoAcceptInvite
  ) {
    return (
      <>
        <InviteAutoAccepter nodeMeta={nodeMeta} onResult={onInviteAutoAcceptResult} />
        {Loader}
      </>
    )
  }

  if (error) {
    return <DocumentErrorFallback error={error} />
  }

  return (
    <div className="relative h-full w-full">
      {ready && debug && docController && editorController && documentState && (
        <DebugMenu docController={docController} editorController={editorController} documentState={documentState} />
      )}

      {ready && <WordCountOverlay />}

      {(!documentState || !editorController) && Loader}

      {documentState &&
        isDocumentState(documentState) &&
        isPrivateNodeMeta(nodeMeta) &&
        documentState.getProperty('userRole').canReadPublicShareUrl() && (
          <AppendPublicShareKeyMaterialToTitle nodeMeta={nodeMeta} documentState={documentState} />
        )}

      {renderEditor && (
        <EditorFrame
          key="docs-editor-iframe"
          onFrameReady={onFrameReady}
          systemMode={isPublicViewer ? EditorSystemMode.PublicView : EditorSystemMode.Edit}
          logger={application.logger}
        />
      )}

      {publicSplashModal}
      {signatureFailedModal}
      {genericAlertModal}
    </div>
  )
}
