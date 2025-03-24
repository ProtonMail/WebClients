import { Icon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useRecentDocuments } from '../../../../__utils/recent-documents'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'

export type OpenFolderProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function OpenFolder({ currentDocument, close }: OpenFolderProps) {
  const { handleOpenFolder } = useRecentDocuments()
  return (
    <ContextMenuButton
      name={c('Action').t`Open folder`}
      icon={<Icon name="folder-open" className="mr-2" />}
      action={() => {
        handleOpenFolder(currentDocument)
      }}
      close={close}
    />
  )
}
