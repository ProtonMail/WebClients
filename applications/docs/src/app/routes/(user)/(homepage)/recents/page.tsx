import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { useSharingModal } from '@proton/drive/public/sharingModal'
import { useMoveItemsModal } from '@proton/drive/public/moveItemsModal'
import { useDocInvites as useDocInvitesLegacy } from '@proton/drive-store/lib/_invites/useDocInvites'
import { HomepageContent, HomepageLayout } from '~/homepage'
import { getCoreEventSubscriber } from '~/drive-sdk/core-event-subscriber'
import { getEventSubscriber } from '~/drive-sdk/event-subscriber'
import { useDocInvites as useDocInvitesSDK } from '~/drive-sdk/useDocInvites'
import { useInvitationsSdkEnabled } from '~/utils/flags'
import { DocumentActionsProvider } from './__utils/document-actions'
import { HomepageViewProvider } from './__utils/homepage-view-sdk'

export default function HomepagePage() {
  const drive = getDrive()
  const useDocInvites = useInvitationsSdkEnabled() ? useDocInvitesSDK : useDocInvitesLegacy

  return (
    <HomepageViewProvider
      drive={drive}
      getEventSubscriber={getEventSubscriber}
      getCoreEventSubscriber={getCoreEventSubscriber}
      useDocInvites={useDocInvites}
    >
      <DocumentActionsProvider
        drive={drive}
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
