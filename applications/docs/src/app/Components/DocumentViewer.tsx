import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ClientToEditorBridge,
  EditorOrchestratorInterface,
  CommitVerificationFailedPayload,
  DocControllerEvent,
} from '@proton/docs-core'
import { CircleLoader } from '@proton/atoms'
import DebugMenu, { useDebug } from './DebugMenu'
import { useApplication } from '../Containers/ApplicationProvider'
import {
  CommentMarkNodeChangeData,
  CommentsEvent,
  FileToDocPendingConversion,
  LiveCommentsEvent,
  LiveCommentsTypeStatusChangeData,
} from '@proton/docs-shared'
import { EditorFrame } from './EditorFrame'
import { useTheme } from '@proton/components'
import { THEME_ID } from '@proton/components/containers/themes/ThemeProvider'
import { mergeRegister } from '@lexical/utils'
import { useSignatureCheckFailedModal } from './SignatureCheckFailedModal'
import { NodeMeta } from '@proton/drive-store'
import { c } from 'ttag'

type Props = {
  lookup: NodeMeta
  injectWithNewContent?: FileToDocPendingConversion
}

export function DocumentViewer({ lookup, injectWithNewContent }: Props) {
  const application = useApplication()

  const [signatureFailedModal, openSignatureFailedModal] = useSignatureCheckFailedModal()
  const isSignatureFailedModalOpen = useRef(false)
  const [hasSignatureIssues, setHasSignatureIssues] = useState(false)

  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null)
  const [docOrchestrator, setDocOrchestrator] = useState<EditorOrchestratorInterface | null>(null)
  const [bridge, setBridge] = useState<ClientToEditorBridge | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debug = useDebug()

  const themeContext = useTheme()
  useEffect(() => {
    if (!bridge) {
      return
    }

    const initialThemeStyles = document.getElementById(THEME_ID)?.innerHTML
    if (initialThemeStyles) {
      void bridge.editorInvoker.receiveThemeChanges(initialThemeStyles)
    }
    return themeContext.addListener(() => {
      const themeStyles = document.getElementById(THEME_ID)?.innerHTML
      if (!themeStyles) {
        return
      }
      void bridge.editorInvoker.receiveThemeChanges(themeStyles)
    })
  }, [bridge, themeContext])

  useEffect(() => {
    if (!bridge) {
      return
    }
    return application.eventBus.addEventCallback(() => {
      void bridge.editorInvoker.handleCommentsChange()
    }, CommentsEvent.CommentsChanged)
  }, [application.eventBus, bridge])

  useEffect(() => {
    return application.eventBus.addEventCallback((data: CommitVerificationFailedPayload) => {
      setHasSignatureIssues(true)
    }, DocControllerEvent.CommitVerificationFailed)
  }, [application.eventBus, bridge])

  const showFailedSignatureModal = useCallback(() => {
    isSignatureFailedModalOpen.current = true
    openSignatureFailedModal({
      commitId: '',
      ignore: () => {
        isSignatureFailedModalOpen.current = false
      },
      accept: (commitId) => {
        setHasSignatureIssues(false)
        isSignatureFailedModalOpen.current = false

        void application.docLoader.getDocController().acceptFailedVerificationCommit(commitId)
      },
    })
  }, [application.docLoader, openSignatureFailedModal])

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

  const createBridge = useCallback(() => {
    if (!docOrchestrator || !frame) {
      return
    }

    const newBridge = new ClientToEditorBridge(frame, docOrchestrator)
    setBridge(newBridge)
    docOrchestrator.passEditorInvokerToDocController(newBridge.editorInvoker)

    void newBridge.editorInvoker.initializeEditor(
      docOrchestrator.docMeta.uniqueIdentifier,
      docOrchestrator.username,
      injectWithNewContent?.data,
      injectWithNewContent?.type,
    )
  }, [docOrchestrator, frame, injectWithNewContent])

  const onFrameReady = useCallback(
    (frame: HTMLIFrameElement) => {
      setFrame(frame)

      if (docOrchestrator) {
        createBridge()
      }
    },
    [docOrchestrator, createBridge],
  )

  useEffect(() => {
    if (docOrchestrator) {
      return
    }

    const observer = application.docLoader.addStatusObserver({
      onSuccess: (orchestrator) => {
        setDocOrchestrator(orchestrator)

        orchestrator.addEditorReadyObserver(() => {
          setIsEditorReady(true)
        })

        if (frame) {
          createBridge()
        }
      },
      onError: (errorMessage) => {
        setError(errorMessage)
      },
    })

    if (!initializing) {
      setInitializing(true)
      void application.docLoader.initialize(lookup)
    }

    return observer
  }, [application, lookup, docOrchestrator, frame, createBridge, initializing])

  if (error) {
    return <div className="flex h-full w-full items-center justify-center text-[color:--signal-danger]">{error}</div>
  }

  return (
    <div className="h-full w-full">
      {isEditorReady && debug && <DebugMenu docController={application.docLoader.getDocController()} />}

      {!docOrchestrator && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <CircleLoader size="large" />
          <div className="text-center">{c('Info').t`Loading document...`}</div>
        </div>
      )}

      <EditorFrame onFrameReady={onFrameReady} />
      {signatureFailedModal}
    </div>
  )
}
