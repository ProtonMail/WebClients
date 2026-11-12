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
  pendingInvitations,
  recentlyAcceptedInvitations,
  acceptInvitation,
  declineInvitation,
  reloadInvitations,
  api,
  logger,
  reportTelemetry,
  createNotification,
  getAppHref,
  dateLocaleCode,
  errorTracking,
  featureFlags,
  openShareModal,
  openMoveItemsModal,
  reportDescriptionContext,
  quickSettings,
  appVersion,
}: HomepagePageProps) {
  return (
    <HomepageViewProvider
      drive={drive}
      eventSubscriber={eventSubscriber}
      coreEventSubscriber={coreEventSubscriber}
      pendingInvitations={pendingInvitations}
      recentlyAcceptedInvitations={recentlyAcceptedInvitations}
      acceptInvitation={acceptInvitation}
      declineInvitation={declineInvitation}
      reloadInvitations={reloadInvitations}
      api={api}
      logger={logger}
      reportTelemetry={reportTelemetry}
      createNotification={createNotification}
      getAppHref={getAppHref}
      dateLocaleCode={dateLocaleCode}
      errorTracking={errorTracking}
      featureFlags={featureFlags}
    >
      <DocumentActionsProvider drive={drive} openShareModal={openShareModal} openMoveItemsModal={openMoveItemsModal}>
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
