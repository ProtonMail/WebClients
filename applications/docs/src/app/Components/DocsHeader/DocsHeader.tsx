import { AppsDropdown, Icon, QuickSettingsAppButton, UserDropdown } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'
import DocumentTitleDropdown from '../layout/DocumentTitleDropdown'
import { DocumentActiveUsers } from '../DocumentActiveUsers'
import { ConnectionStatus } from '../layout/ConnectionStatus'
import { DocControllerInterface } from '@proton/docs-core'
import { useEffect, useState } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'
import { Button } from '@proton/atoms'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { CommentsButton } from './CommentsButton'

const DocsHeader = () => {
  const application = useApplication()

  const [controller, setController] = useState<DocControllerInterface | null>(null)
  useEffect(() => {
    return application.docLoader.addStatusObserver({
      onSuccess: () => {
        setController(application.docLoader.getDocController())
      },
      onError: traceError,
    })
  }, [application.docLoader])

  return (
    <div className="flex items-center px-4 py-2">
      <AppsDropdown app={APPS.PROTONDOCS} />
      <DocumentTitleDropdown controller={controller} />
      <div className="w-2" />
      <ConnectionStatus />
      <div className="mr-auto" />
      <DocumentActiveUsers className="mr-2 hidden md:flex" />
      {controller?.role.isAdmin() && (
        <>
          <Button
            shape="ghost"
            className="hidden items-center gap-2 text-sm md:flex"
            data-testid="share-button"
            onClick={() => controller.openDocumentSharingModal()}
          >
            <Icon name="user-plus" />
            Share
          </Button>
          <CommentsButton controller={controller} />
        </>
      )}
      <QuickSettingsAppButton />
      <div className="w-4" />
      <UserDropdown app={APPS.PROTONDOCS} />
    </div>
  )
}

export default DocsHeader
