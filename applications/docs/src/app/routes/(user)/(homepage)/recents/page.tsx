import {
  DocumentActionsProvider,
  type DocumentActionsProviderProps,
  HomepageContent,
  HomepageLayout,
  type HomepageLayoutProps,
  HomepageViewProvider,
  type HomepageViewProviderProps,
} from '~/homepage'

export type HomepagePageProps = Omit<HomepageViewProviderProps, 'children'> &
  Omit<DocumentActionsProviderProps, 'children'> &
  Omit<HomepageLayoutProps, 'children'>

export default function HomepagePage({
  drive,
  eventSubscriber,
  coreEventSubscriber,
  useDocInvites,
  api,
  logger,
  reportTelemetry,
  useSharingModal,
  useMoveItemsModal,
  reportDescriptionContext,
  quickSettings,
}: HomepagePageProps) {
  return (
    <HomepageViewProvider
      drive={drive}
      eventSubscriber={eventSubscriber}
      coreEventSubscriber={coreEventSubscriber}
      useDocInvites={useDocInvites}
      api={api}
      logger={logger}
      reportTelemetry={reportTelemetry}
    >
      <DocumentActionsProvider drive={drive} useSharingModal={useSharingModal} useMoveItemsModal={useMoveItemsModal}>
        <HomepageLayout reportDescriptionContext={reportDescriptionContext} quickSettings={quickSettings}>
          <HomepageContent />
        </HomepageLayout>
      </DocumentActionsProvider>
    </HomepageViewProvider>
  )
}
