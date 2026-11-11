import { OfferRenewNoticeProvider } from '@proton/payments-ui/ui/components/OfferRenewNoticeProvider'
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
  getAppHref,
  dateLocaleCode,
  errorTracking,
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
      getAppHref={getAppHref}
      dateLocaleCode={dateLocaleCode}
      errorTracking={errorTracking}
    >
      <DocumentActionsProvider drive={drive} useSharingModal={useSharingModal} useMoveItemsModal={useMoveItemsModal}>
        {/* The header's offers (useFetchOffer in @proton/components) read their renewal notice from it */}
        <OfferRenewNoticeProvider>
          <HomepageLayout
            reportDescriptionContext={reportDescriptionContext}
            quickSettings={quickSettings}
            appVersion={appVersion}
          >
            <HomepageContent />
          </HomepageLayout>
        </OfferRenewNoticeProvider>
      </DocumentActionsProvider>
    </HomepageViewProvider>
  )
}
