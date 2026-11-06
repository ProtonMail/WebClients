import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { useSharingModal } from '@proton/drive/public/sharingModal'
import { useMoveItemsModal } from '@proton/drive/public/moveItemsModal'
import { HomepageContent, HomepageLayout } from '~/homepage'
import { DocumentActionsProvider } from './__utils/document-actions'
import { HomepageViewProvider } from './__utils/homepage-view-sdk'

export default function HomepagePage() {
  return (
    <HomepageViewProvider>
      <DocumentActionsProvider
        drive={getDrive()}
        generateNodeUid={generateNodeUid}
        useSharingModal={useSharingModal}
        useMoveItemsModal={useMoveItemsModal}
      >
        <HomepageLayout>
          <HomepageContent />
        </HomepageLayout>
      </DocumentActionsProvider>
    </HomepageViewProvider>
  )
}
