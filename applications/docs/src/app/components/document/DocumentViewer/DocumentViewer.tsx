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
  isDocumentState,
} from '@proton/docs-core'
import { CircleLoader } from '@proton/atoms'
import { DebugMenu, useDebug } from './DebugMenu'
import type {
  CommentMarkNodeChangeData,
  EditorInitializationConfig,
  LiveCommentsTypeStatusChangeData,
} from '@proton/docs-shared'
import {
  CommentsEvent,
  EditorEvent,
  EditorSystemMode,
  isLocalEnvironment,
  LiveCommentsEvent,
} from '@proton/docs-shared'
import { EditorFrame } from '../EditorFrame'
import { mergeRegister } from '@lexical/utils'
import { useSignatureCheckFailedModal } from './SignatureCheckFailedModal'
import {
  isPrivateNodeMeta,
  isPublicNodeMeta,
  type DocumentAction,
  type NodeMeta,
  type PublicNodeMeta,
} from '@proton/drive-store'
import { c } from 'ttag'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import { Availability, AvailabilityTypes } from '@proton/utils/availability'
import { useGetUserSettings } from '@proton/account/userSettings/hooks'
import { WordCountOverlay } from '../WordCount'
import { useWelcomeSplashModal } from '../public/WelcomeSplashModal'
import type { EditorControllerInterface } from '@proton/docs-core'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import type { InviteAutoAcceptResult } from './InviteAutoAccepter'
import { InviteAutoAccepter } from './InviteAutoAccepter'
import { type DocumentError, DocumentErrorFallback } from './DocumentErrorFallback'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { useAuthentication } from '@proton/components'
import { useApplication } from '~/utils/application-context'
import { useDocsUrlBar } from '~/utils/docs-url-bar'
import { AppendPublicShareKeyMaterialToTitle } from './append-public-share-key-material-to-title'
import useFlag from '@proton/unleash/useFlag'
import type { ProviderType } from '../../../provider-type'
import { tmpConvertNewDocTypeToOld, type DocumentType } from '@proton/drive-store/store/_documents'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import { UserSettingsProvider } from '@proton/drive-store/store'
import { useDocsContext } from '../context'

export function useSuggestionsFeatureFlag() {
  const isDisabled = useFlag('DocsSuggestionsDisabled')
  return { isSuggestionsEnabled: !isDisabled }
}

export type DocumentViewerProps = {
  nodeMeta: NodeMeta | PublicNodeMeta
  editorInitializationConfig?: EditorInitializationConfig
  providerType: ProviderType
  openAction: DocumentAction
  actionMode: DocumentAction['mode'] | undefined
  documentType: DocumentType | ProtonDocumentType
}

export function DocumentViewer({
  nodeMeta,
  editorInitializationConfig,
  openAction,
  actionMode,
  providerType,
  documentType,
}: DocumentViewerProps) {
  const application = useApplication()
  const { getLocalID } = useAuthentication()
  const getUserSettings = useGetUserSettings()
  const debug = useDebug()

  const { removeLocalIDFromUrl } = useDocsUrlBar()

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

  const isDownloadAction = actionMode === 'download' || openAction.mode === 'open-url-download'
  useEffect(() => {
    if (isDownloadAction && didLoadTitle && didLoadEditorContent && docOrchestrator) {
      void docOrchestrator.exportAndDownload(tmpConvertNewDocTypeToOld(documentType) === 'doc' ? 'docx' : 'xlsx')
    }
  }, [docOrchestrator, didLoadTitle, didLoadEditorContent, isDownloadAction, documentType])

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
        openPublicSplashModal({ editorController, documentState: documentState as PublicDocumentState, documentType })
      }
    }, EditorEvent.ToolbarClicked)
  }, [application.eventBus, isPublicViewer, openPublicSplashModal, editorController, documentState, documentType])

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
        const localID = getLocalID()
        if (localID !== undefined) {
          CacheService.setLocalIDForDocumentInCache(nodeMeta, localID)
        }
      },
      onError: (errorMessage, code) => {
        setError({ message: errorMessage, userUnderstandableMessage: false, code })
        application.metrics.reportFullyBlockingErrorModal()
      },
    })

    if (!initializing) {
      setInitializing(true)

      void application.getDocLoader().initialize(nodeMeta, tmpConvertNewDocTypeToOld(documentType))
    }

    return disposer
  }, [application, docOrchestrator, documentType, getLocalID, initializing, nodeMeta, removeLocalIDFromUrl])

  useEffect(() => {
    if (docOrchestrator && editorFrame && editorController && !bridge) {
      createBridge(docOrchestrator, editorFrame, editorController)
    }
  }, [docOrchestrator, editorFrame, createBridge, bridge, editorController])

  /**
   * If a document fails to load with insufficient permissions, we try to see if there's a pending invite for it
   * and autoaccept it, before showing any error state to the user.
   */
  const [didAttemptToAutoAcceptInvite, setDidAttemptToAutoAcceptInvite] = useState(false)
  const [wasAutoAcceptSuccessful, setWasAutoAcceptSuccessful] = useState(false)

  const onInviteAutoAcceptResult = useCallback(
    (result: InviteAutoAcceptResult) => {
      setWasAutoAcceptSuccessful(result.success)
      setDidAttemptToAutoAcceptInvite(true)

      if (result.success) {
        application.logger.info('Invite auto-accept successful, reloading page')

        if (isPublicNodeMeta(nodeMeta)) {
          application.compatWrapper.getPublicCompat().redirectToAuthedDocument({
            volumeId: result.acceptedNodeMeta.volumeId,
            linkId: result.acceptedNodeMeta.linkId,
          })
        } else {
          window.location.reload()
        }
      }
    },
    [application.compatWrapper, application.logger, nodeMeta],
  )

  const Loader = (
    <div className="relative h-full w-full">
      <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
        <div className="text-center">{c('Info').t`Loading document...`}</div>
      </div>
    </div>
  )

  /**
   * If we are in the public app, and the user is signed in, and the user does not have edit access, we'll check
   * to see if there is a pending invite for the document. If there is, we'll autoaccept it.
   */
  const isSignedInUserInPublicReadonlyMode =
    getLocalID() !== undefined && isPublicViewer && providerType === 'public-authenticated'
  /**
   * If we are in private mode, and the user does not have access to the document at all, we'll check
   * to see if there is a pending invite for the document. If there is, we'll autoaccept it.
   */
  const isPrivateModeUserWithInsufficientPermissions =
    isPrivateNodeMeta(nodeMeta) && error && error.code === DocsApiErrorCode.InsufficientPermissions

  const { publicContext, privateContext } = useDocsContext()

  if (
    !didAttemptToAutoAcceptInvite &&
    (isSignedInUserInPublicReadonlyMode || isPrivateModeUserWithInsufficientPermissions)
  ) {
    application.logger.info('Attempting to auto-accept invite (if found)')

    return (
      <>
        <UserSettingsProvider
          initialUser={publicContext?.user ?? privateContext?.user ?? ({} as any)}
          initialDriveUserSettings={{
            Defaults: {
              RevisionRetentionDays: 0,
              B2BPhotosEnabled: false,
              PhotoTags: [],
            },
            UserSettings: {
              Sort: null,
              Layout: null,
              RevisionRetentionDays: null,
              B2BPhotosEnabled: null,
              PhotoTags: null,
            },
          }}
        >
          <InviteAutoAccepter nodeMeta={nodeMeta} onResult={onInviteAutoAcceptResult} />
        </UserSettingsProvider>
        {Loader}
      </>
    )
  }

  if (wasAutoAcceptSuccessful) {
    // Prevent flash of "Something went wrong" while page is still reloading.
    return Loader
  }

  if (error) {
    return <DocumentErrorFallback error={error} />
  }

  return (
    <div className="relative h-full w-full">
      {ready && debug && docController && editorController && documentState && (
        <DebugMenu
          docController={docController}
          editorController={editorController}
          documentState={documentState}
          documentType={tmpConvertNewDocTypeToOld(openAction.type)}
        />
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
          documentType={tmpConvertNewDocTypeToOld(openAction.type)}
        />
      )}

      {publicSplashModal}
      {signatureFailedModal}
      {genericAlertModal}
    </div>
  )
}
