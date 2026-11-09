import { HomepageContent, HomepageLayout } from '~/homepage'
import { DocumentActionsProvider, type DocumentActionsProviderProps } from './__utils/document-actions'
import { HomepageViewProvider } from './__utils/homepage-view-sdk'
import type { HomepageViewProviderProps } from './__utils/homepage-view-sdk-utils'

export type HomepagePageProps = Omit<HomepageViewProviderProps, 'children'> &
  Omit<DocumentActionsProviderProps, 'children'>

export default function HomepagePage({
  drive,
  eventSubscriber,
  coreEventSubscriber,
  useDocInvites,
  useSharingModal,
  useMoveItemsModal,
}: HomepagePageProps) {
  return (
    <HomepageViewProvider
      drive={drive}
      eventSubscriber={eventSubscriber}
      coreEventSubscriber={coreEventSubscriber}
      useDocInvites={useDocInvites}
    >
      <DocumentActionsProvider drive={drive} useSharingModal={useSharingModal} useMoveItemsModal={useMoveItemsModal}>
        <HomepageLayout>
          <HomepageContent />
        </HomepageLayout>
      </DocumentActionsProvider>
    </HomepageViewProvider>
  )
}
