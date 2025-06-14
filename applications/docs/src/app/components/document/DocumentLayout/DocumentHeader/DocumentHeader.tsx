import { AppsDropdown, Icon, Logo, MimeIcon, useActiveBreakpoint, UserDropdown } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'
import { DocumentTitleDropdown } from './DocumentTitleDropdown/DocumentTitleDropdown'
import { DocumentActiveUsers } from './DocumentActiveUsers'
import { ConnectionStatus } from './ConnectionStatus'
import { useEffect, useMemo, useState } from 'react'
import { useApplication } from '~/utils/application-context'
import { Button } from '@proton/atoms'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { CommentsButton } from './CommentsButton'
import { c } from 'ttag'
import type { DocumentAction } from '@proton/drive-store'
import { PopoverPill } from './PopoverPill'
import { useDocsContext } from '../../context'
import { HeaderPublicOptions } from '../../public/HeaderPublicOptions'
import { type EditorControllerInterface } from '@proton/docs-core'
import type {
  AuthenticatedDocControllerInterface,
  DocumentState,
  PublicDocumentState,
  RenameControllerInterface,
} from '@proton/docs-core'
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import useFlag from '@proton/unleash/useFlag'
import clsx from '@proton/utils/clsx'

function getWindowLocationExcludingDomain() {
  return stripLocalBasenameFromPathname(window.location.pathname) + window.location.search + window.location.hash
}

export type DocsHeaderProps = { actionMode?: DocumentAction['mode']; documentType: DocumentType }

export function DocumentHeader({ actionMode, documentType }: DocsHeaderProps) {
  const application = useApplication()

  const [isReady, setIsReady] = useState(false)

  const [authenticatedController, setAuthenticatedController] = useState<
    AuthenticatedDocControllerInterface | undefined
  >(undefined)
  const [renameController, setRenameController] = useState<RenameControllerInterface>()
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
        setRenameController(result.renameController)
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
        documentType={documentType}
        actionMode={actionMode}
        editorController={editorController}
        documentState={documentState}
        authenticatedController={authenticatedController}
        renameController={renameController}
      />
    )
  }

  if (showErrorHeader) {
    return <DocsHeaderNoDocument />
  }

  return null
}

/**
 * Header shown if there is an error loading a document.
 */
function DocsHeaderNoDocument() {
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
        <UserDropdown
          app={APPS.PROTONDOCS}
          sessionOptions={{
            path: getWindowLocationExcludingDomain(),
            target: '_self',
          }}
        />
      </div>
    </div>
  )
}

type DocsHeaderForDocumentProps = {
  actionMode?: DocumentAction['mode']
  editorController: EditorControllerInterface
  documentState: DocumentState | PublicDocumentState
  authenticatedController: AuthenticatedDocControllerInterface | undefined
  renameController: RenameControllerInterface | undefined
  documentType: DocumentType
}

/**
 * Header shown while a document is present.
 */
function DocsHeaderForDocument({
  actionMode,
  editorController,
  documentState,
  authenticatedController,
  renameController,
  documentType,
}: DocsHeaderForDocumentProps) {
  const { publicContext } = useDocsContext()
  const role = useMemo(() => documentState.getProperty('userRole'), [documentState])
  const isHomepageEnabled = useFlag('DocsHomepageEnabled')

  const icon = (
    <MimeIcon
      name={documentType === 'sheet' ? 'proton-sheet' : 'proton-doc'}
      size={5}
      className="ml-[.4375rem] mr-[.0625rem] shrink-0"
    />
  )

  return (
    <div
      className={clsx('flex flex-nowrap items-center gap-2 px-3 py-2', documentType === 'sheet' && 'bg-[#F9FBFC]')}
      data-testid="docs-header"
    >
      <div className="flex flex-1 flex-nowrap items-center head-480-749:!flex-none head-max-479:!basis-auto">
        {isHomepageEnabled ? <a href={getAppHref('/', APPS.PROTONDOCS)}>{icon}</a> : icon}

        <DocumentTitleDropdown
          documentType={documentType}
          actionMode={actionMode}
          authenticatedController={authenticatedController}
          editorController={editorController}
          documentState={documentState}
          renameController={renameController}
        />
        <div
          className="flex-grow-1 flex-basis-0 ml-0.5 flex min-w-fit flex-shrink-0 items-center justify-between gap-2 head-max-1199:!max-w-[4.5rem]"
          data-testid="status-container"
        >
          <ConnectionStatus documentState={documentState} />
          <div className="flex-none head-max-479:![display:none]">{!role.canEdit() && <ViewOnlyPill />}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-nowrap items-center justify-end head-max-479:!flex-shrink-0 head-max-479:!basis-auto">
        {publicContext ? (
          <HeaderPublicOptions
            editorController={editorController}
            documentState={documentState as PublicDocumentState}
            documentType={documentType}
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

        {!publicContext && (
          <>
            {documentState.getProperty('userRole').canComment() && (
              <CommentsButton editorController={editorController} />
            )}
            <div className="w-2" />
            <UserDropdown
              app={APPS.PROTONDOCS}
              sessionOptions={{ path: getWindowLocationExcludingDomain(), target: '_self' }}
            />
          </>
        )}
      </div>
    </div>
  )
}

function ViewOnlyPill() {
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
