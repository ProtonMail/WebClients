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
    <div className="flex flex-nowrap items-center gap-2 px-3 py-2" data-testid="docs-header">
      <div className="flex flex-1 flex-nowrap items-center head-480-749:flex-none head-max-479:basis-auto">
        <DocumentTitleDropdown
          action={action}
          authenticatedController={controller}
          editorController={editorController}
          documentState={documentState}
        />
        <div
          className="ml-0.5 flex min-w-fit flex-1 flex-shrink-0 items-center justify-between gap-2 head-max-1199:max-w-[4.5rem]"
          data-testid="status-container"
        >
          <ConnectionStatus documentState={documentState} />
          <div className="flex-none head-max-479:[display:none]">{role?.isPublicViewer() && <ViewOnlyPill />}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-nowrap items-center justify-end head-max-479:flex-shrink-0 head-max-479:basis-auto">
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
                className="flex flex-nowrap items-center gap-2 text-sm head-max-849:mr-2 head-max-849:border head-max-849:border-[--border-norm] head-max-849:px-[0.5em]"
                data-testid="share-button"
                onClick={() => controller?.openDocumentSharingModal()}
              >
                <Icon name="user-plus" />
                <span className="head-max-849:sr-only">{c('Action').t`Share`}</span>
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
