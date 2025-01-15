import { AppsDropdown, Icon, Logo, useActiveBreakpoint, UserDropdown } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'
import DocumentTitleDropdown from '../layout/DocumentTitleDropdown'
import { DocumentActiveUsers } from '../DocumentActiveUsers'
import { ConnectionStatus } from '../layout/ConnectionStatus'
import { useEffect, useMemo, useState } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'
import { Button } from '@proton/atoms'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { CommentsButton } from './CommentsButton'
import { c } from 'ttag'
import type { DocumentAction } from '@proton/drive-store'
import PopoverPill from '../PopoverPill'
import { useDocsContext } from '../../Containers/DocsContextProvider'
import { HeaderPublicOptions } from '../../Apps/Public/Header/HeaderPublicOptions'
import type { EditorControllerInterface } from '@proton/docs-core'
import type { AuthenticatedDocControllerInterface, DocumentState, PublicDocumentState } from '@proton/docs-core'

const DocsHeader = ({ action }: { action?: DocumentAction['mode'] }) => {
  const application = useApplication()

  const [isReady, setIsReady] = useState(false)

  const [authenticatedController, setAuthenticatedController] = useState<
    AuthenticatedDocControllerInterface | undefined
  >(undefined)
  const [editorController, setEditorController] = useState<EditorControllerInterface | null>(null)
  const [documentState, setDocumentState] = useState<DocumentState | PublicDocumentState | null>(null)
  const [showErrorHeader, setShowErrorHeader] = useState(false)

  useEffect(() => {
    return application.userState.subscribeToEvent('BlockingInterfaceErrorDidDisplay', () => {
      setShowErrorHeader(true)
    })
  }, [application.userState])

  useEffect(() => {
    return application.getDocLoader().addStatusObserver({
      onSuccess: (result) => {
        setIsReady(true)
        setAuthenticatedController(result.docController)
        setEditorController(result.editorController)
        setDocumentState(result.documentState)
      },
      onError: (error) => {
        traceError(error)
      },
    })
  }, [application])

  if (application.isRunningInNativeMobileWeb) {
    return null
  }

  if (isReady && editorController && documentState) {
    return (
      <DocsHeaderForDocument
        action={action}
        editorController={editorController}
        documentState={documentState}
        authenticatedController={authenticatedController}
      />
    )
  }

  if (showErrorHeader) {
    return <DocsHeaderNoDocument />
  }

  return null
}

/** Header shown if there is an error loading a document */
const DocsHeaderNoDocument = () => {
  const { viewportWidth } = useActiveBreakpoint()

  return (
    <div className="error-header flex flex-nowrap items-center justify-between gap-2 bg-signalInfoMinorCustom px-10 pt-5">
      <div className="flex flex-shrink-0 flex-nowrap items-center gap-2">
        <Logo variant={viewportWidth['<=small'] ? 'glyph-only' : 'with-wordmark'} appName={APPS.PROTONDOCS} />
        <AppsDropdown />
      </div>
      <div className="hidden items-center justify-center text-center md:flex">
        <Icon name="lock-filled" className="mr-1.5" />
        <span className="pt-0.5 text-sm">{c('Title').t`End-to-end encrypted`}</span>
      </div>
      <div className="no-doc-header">
        <UserDropdown app={APPS.PROTONDOCS} />
      </div>
    </div>
  )
}

/** Header shown while a document is present */
const DocsHeaderForDocument = ({
  action,
  editorController,
  documentState,
  authenticatedController,
}: {
  action?: DocumentAction['mode']
  editorController: EditorControllerInterface
  documentState: DocumentState | PublicDocumentState
  authenticatedController: AuthenticatedDocControllerInterface | undefined
}) => {
  const { publicContext } = useDocsContext()
  const role = useMemo(() => documentState.getProperty('userRole'), [documentState])

  return (
    <div className="flex flex-nowrap items-center gap-2 px-3 py-2" data-testid="docs-header">
      <div className="flex flex-1 flex-nowrap items-center head-480-749:!flex-none head-max-479:!basis-auto">
        <DocumentTitleDropdown
          action={action}
          authenticatedController={authenticatedController}
          editorController={editorController}
          documentState={documentState}
        />
        <div
          className="flex-grow-1 flex-basis-0 ml-0.5 flex min-w-fit flex-shrink-0 items-center justify-between gap-2 head-max-1199:!max-w-[4.5rem]"
          data-testid="status-container"
        >
          <ConnectionStatus documentState={documentState} />
          <div className="flex-none head-max-479:![display:none]">{role?.isPublicViewer() && <ViewOnlyPill />}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-nowrap items-center justify-end head-max-479:!flex-shrink-0 head-max-479:!basis-auto">
        {publicContext ? (
          <HeaderPublicOptions
            editorController={editorController}
            documentState={documentState as PublicDocumentState}
          />
        ) : (
          <>
            <DocumentActiveUsers className="mr-2 hidden md:flex" />

            {documentState.getProperty('userRole').canShare() && (
              <Button
                shape="ghost"
                className="flex flex-nowrap items-center gap-2 head-max-849:!mr-2 head-max-849:!border head-max-849:!border-[--border-norm] head-max-849:!px-[0.5em]"
                data-testid="share-button"
                onClick={() => authenticatedController?.openDocumentSharingModal()}
              >
                <Icon name="user-plus" />
                <span className="head-max-849:!sr-only">{c('Action').t`Share`}</span>
              </Button>
            )}
          </>
        )}

        {documentState.getProperty('userRole').canComment() && <CommentsButton editorController={editorController} />}

        {!publicContext && (
          <>
            <div className="w-2" />

            <UserDropdown app={APPS.PROTONDOCS} />
          </>
        )}
      </div>
    </div>
  )
}

const ViewOnlyPill = () => {
  return (
    <PopoverPill
      // eslint-disable-next-line custom-rules/deprecate-classes
      alignment="center"
      title={
        <div className="flex gap-2" data-testid="changes-info-e2e-encrypted">
          <Icon name="eye" className="h-6 w-6 fill-current" />
          <span>{c('Info').t`View only`}</span>
        </div>
      }
      content={c('Info')
        .t`You are currently viewing this document in view-only mode. Reach out to the owner to request access to edit and comment.`}
    >
      <Icon name="eye" className="h-4 w-4 fill-current" />
      <span className="head-max-1199:sr-only">{c('Info').t`View only`}</span>
    </PopoverPill>
  )
}

export default DocsHeader
