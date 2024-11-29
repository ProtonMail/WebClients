import { Icon, UserDropdown } from '@proton/components'
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
import { useDocsContext } from '../../Containers/ContextProvider'
import { HeaderPublicOptions } from '../../Apps/Public/Header/HeaderPublicOptions'
import type { EditorControllerInterface } from '@proton/docs-core'
import type { AuthenticatedDocControllerInterface, DocumentState, PublicDocumentState } from '@proton/docs-core'

const DocsHeader = ({ action }: { action?: DocumentAction['mode'] }) => {
  const application = useApplication()

  const [isReady, setIsReady] = useState(false)

  const { publicContext } = useDocsContext()

  const [controller, setController] = useState<AuthenticatedDocControllerInterface | undefined>(undefined)
  const [editorController, setEditorController] = useState<EditorControllerInterface | null>(null)
  const [documentState, setDocumentState] = useState<DocumentState | PublicDocumentState | null>(null)

  const role = useMemo(() => documentState?.getProperty('userRole'), [documentState])

  useEffect(() => {
    return application.getDocLoader().addStatusObserver({
      onSuccess: (result) => {
        setIsReady(true)
        setController(result.docController)
        setEditorController(result.editorController)
        setDocumentState(result.documentState)
      },
      onError: traceError,
    })
  }, [application])

  if (application.isRunningInNativeMobileWeb || !isReady || !editorController || !documentState) {
    return null
  }

  return (
    <div className="flex items-center px-4 py-2" data-testid="docs-header">
      {/* Left */}
      <div className="flex flex-1 items-center">
        <DocumentTitleDropdown
          action={action}
          authenticatedController={controller}
          editorController={editorController}
          documentState={documentState}
        />
        <div className="w-2" />
        <ConnectionStatus documentState={documentState} />
      </div>

      {/* Middle */}
      <div className="flex-none">{role?.isPublicViewer() && <ViewOnlyPill />}</div>

      {/* Right */}
      <div className="flex flex-1 items-center justify-end">
        {publicContext ? (
          <HeaderPublicOptions
            editorController={editorController}
            documentState={documentState as PublicDocumentState}
          />
        ) : (
          <>
            <DocumentActiveUsers className="mr-2 hidden md:flex" />

            {documentState.getProperty('userRole').isAdmin() && (
              <Button
                shape="ghost"
                className="flex items-center gap-2 text-sm"
                data-testid="share-button"
                onClick={() => controller?.openDocumentSharingModal()}
              >
                <Icon name="user-plus" />
                {c('Action').t`Share`}
              </Button>
            )}

            {documentState.getProperty('userRole').canComment() && (
              <CommentsButton editorController={editorController} />
            )}

            <div className="w-4" />

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
      {c('Info').t`View only`}
    </PopoverPill>
  )
}

export default DocsHeader
