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
  createNotification,
  useSharingModal,
  useMoveItemsModal,
  reportDescriptionContext,
  quickSettings,
  appVersion,
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
      createNotification={createNotification}
    >
      <DocumentActionsProvider drive={drive} useSharingModal={useSharingModal} useMoveItemsModal={useMoveItemsModal}>
        <HomepageLayout
          reportDescriptionContext={reportDescriptionContext}
          quickSettings={quickSettings}
          appVersion={appVersion}
        >
          <HomepageContent />
        </HomepageLayout>
      </DocumentActionsProvider>
    </HomepageViewProvider>
  )
}
