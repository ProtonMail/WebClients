import { Icon, UserDropdown } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'
import DocumentTitleDropdown from '../layout/DocumentTitleDropdown'
import { DocumentActiveUsers } from '../DocumentActiveUsers'
import { ConnectionStatus } from '../layout/ConnectionStatus'
import { useEffect, useState } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'
import { Button } from '@proton/atoms'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { CommentsButton } from './CommentsButton'
import { c } from 'ttag'
import type { DocumentAction } from '@proton/drive-store'
import type { AnyDocControllerInterface } from '@proton/docs-core/lib/Controller/Document/AnyDocControllerInterface'
import { isPrivateDocController } from '@proton/docs-core/lib/Controller/Document/isPrivateDocController'
import PopoverPill from '../PopoverPill'
import { getAppHref } from '@proton/shared/lib/apps/helper'

const DocsHeader = ({ action }: { action?: DocumentAction['mode'] }) => {
  const application = useApplication()
  const [isReady, setIsReady] = useState(false)
  const isPublicMode = application.isPublicMode

  const [controller, setController] = useState<AnyDocControllerInterface | null>(null)
  useEffect(() => {
    return application.docLoader.addStatusObserver({
      onSuccess: () => {
        setIsReady(true)
        setController(application.docLoader.getDocController())
      },
      onError: traceError,
    })
  }, [application.docLoader])

  if (application.isRunningInNativeMobileWeb || !isReady || !controller) {
    return null
  }

  return (
    <div className="flex items-center px-4 py-2" data-testid="docs-header">
      {/* Left */}
      <div className="flex flex-1 items-center">
        <DocumentTitleDropdown action={action} controller={controller} />
        <div className="w-2" />
        <ConnectionStatus />
      </div>

      {/* Middle */}
      <div className="flex-none">{isPublicMode && <ViewOnlyPill />}</div>

      {/* Right */}
      <div className="flex flex-1 items-center justify-end">
        {isPublicMode ? (
          <PublicLoginOptions />
        ) : (
          <>
            <DocumentActiveUsers className="mr-2 hidden md:flex" />

            {isPrivateDocController(controller) && controller.role.isAdmin() && (
              <Button
                shape="ghost"
                className="flex items-center gap-2 text-sm"
                data-testid="share-button"
                onClick={() => controller.openDocumentSharingModal()}
              >
                <Icon name="user-plus" />
                {c('Action').t`Share`}
              </Button>
            )}

            {isPrivateDocController(controller) && controller?.role.canComment() && (
              <CommentsButton controller={controller} />
            )}

            <div className="w-4" />

            <UserDropdown app={APPS.PROTONDOCS} />
          </>
        )}
      </div>
    </div>
  )
}

const PublicLoginOptions = () => {
  const openAuthPage = (to = '/', target = '_blank') => {
    window.open(getAppHref(to, APPS.PROTONDOCS), target)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="small"
        className="flex items-center gap-2 text-sm"
        data-testid="public-login-button"
        onClick={() => openAuthPage()}
      >
        <Icon name="arrow-in-to-rectangle" />
        {c('Action').t`Login`}
      </Button>

      <Button
        color="norm"
        size="small"
        className="flex items-center gap-2 text-sm"
        data-testid="public-register-button"
        onClick={() => openAuthPage()}
      >
        <Icon name="user-plus" />
        {c('Action').t`Sign up`}
      </Button>
    </div>
  )
}

const ViewOnlyPill = () => {
  return (
    <PopoverPill
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
