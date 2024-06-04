import { AppsDropdown, Icon, QuickSettingsAppButton, UserDropdown } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'
import DocumentTitleDropdown from './DocumentTitleDropdown'
import { DocumentActiveUsers } from '../DocumentActiveUsers'
import { ConnectionStatus } from './ConnectionStatus'
import { DocControllerInterface } from '@proton/docs-core'
import { useEffect, useState } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'
import { Button } from '@proton/atoms'
import { traceError } from '@proton/shared/lib/helpers/sentry'

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
      {controller && (
        <>
          <Button
            shape="ghost"
            className="flex items-center gap-2 text-sm"
            onClick={() => controller.openDocumentSharingModal()}
          >
            <Icon name="user-plus" />
            Share
          </Button>
          <Button
            icon
            shape="ghost"
            className="flex items-center gap-2 text-sm"
            onClick={() => controller.showCommentsPanel()}
          >
            <Icon name="speech-bubble" />
          </Button>
        </>
      )}
      <DocumentActiveUsers />
      <QuickSettingsAppButton />
      <div className="w-4" />
      <UserDropdown app={APPS.PROTONDOCS} />
    </div>
  )
}

export default DocsHeader
