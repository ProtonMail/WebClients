import { AppsDropdown, QuickSettingsAppButton, UserDropdown } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'
import DocumentTitleDropdown from './DocumentTitleDropdown'
import { DocumentActiveUsers } from '../DocumentActiveUsers'
import { ConnectionStatus } from './ConnectionStatus'

const DocsHeader = () => {
  return (
    <div className="flex items-center gap-4 px-4 py-2">
      <AppsDropdown app={APPS.PROTONDOCS} />
      <DocumentTitleDropdown />
      <ConnectionStatus />
      <div className="mr-auto" />
      <DocumentActiveUsers />
      <QuickSettingsAppButton />
      <UserDropdown app={APPS.PROTONDOCS} />
    </div>
  )
}

export default DocsHeader
