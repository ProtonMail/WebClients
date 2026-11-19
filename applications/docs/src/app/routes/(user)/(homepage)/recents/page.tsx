import { OfferRenewNoticeProvider } from '@proton/payments-ui/ui/components/OfferRenewNoticeProvider'
import {
  DocumentActionsProvider,
  type DocumentActionsProviderProps,
  HomepageContent,
  HomepageMessagesProvider,
  HomepageViewProvider,
  type HomepageViewProviderProps,
} from '~/homepage'
import { HomepageShell, type HomepageShellProps } from '../__components/HomepageShell'
import { useHomepageLocalization } from '../__utils/useHomepageLocalization'

export type HomepagePageProps = Omit<HomepageViewProviderProps, 'children'> &
  Omit<DocumentActionsProviderProps, 'children'> &
  Omit<HomepageShellProps, 'children'>

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
  addresses,
  contactEmails,
  openShareModal,
  openMoveItemsModal,
  reportDescriptionContext,
  appVersion,
}: HomepagePageProps) {
  const messages = useHomepageLocalization()

  return (
    <HomepageMessagesProvider messages={messages}>
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
        addresses={addresses}
        contactEmails={contactEmails}
      >
        <DocumentActionsProvider drive={drive} openShareModal={openShareModal} openMoveItemsModal={openMoveItemsModal}>
          <OfferRenewNoticeProvider>
            <HomepageShell reportDescriptionContext={reportDescriptionContext} appVersion={appVersion}>
              <HomepageContent />
            </HomepageShell>
          </OfferRenewNoticeProvider>
        </DocumentActionsProvider>
      </HomepageViewProvider>
    </HomepageMessagesProvider>
  )
}
