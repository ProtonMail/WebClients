import { useDocInvites as useDocInvitesLegacy } from '@proton/drive-store/lib/_invites/useDocInvites'
import { getDrive } from '@proton/drive/sdk'
import { useSharingModal } from '@proton/drive/public/sharingModal'
import { useMoveItemsModal } from '@proton/drive/public/moveItemsModal'
import { useApi } from '@proton/app-context/useApi'
import { useConfig } from '@proton/app-context/useConfig'
import { useNotifications } from '@proton/app-context/useNotifications'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { useAddresses } from '@proton/account/addresses/hooks'
import { useContactEmails } from '@proton/account/contactEmails/hooks'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import type { APP_NAMES } from '@proton/shared/lib/constants'
import { dateLocale } from '@proton/shared/lib/i18n'
import { addSentryBreadcrumb, getSentryError, traceError } from '@proton/shared/lib/helpers/sentry'
import type { Application } from '@proton/docs-core/Application/Application'
import type { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { Suspense, lazy, useCallback, useMemo } from 'react'

import { useBulkMoveEnabled, useBulkTrashEnabled, useInvitationsSdkEnabled } from '~/utils/flags'
import { getCoreEventSubscriber } from '~/drive-sdk/core-event-subscriber'
import { getEventSubscriber } from '~/drive-sdk/event-subscriber'
import { useDocInvites as useDocInvitesSDK } from '~/drive-sdk/useDocInvites'
import { getDocsReportContextLines } from '~/utils/report-context'
import { DocsQuickSettings } from '~/components/DocsQuickSettings'
import { useHomepageInvitations } from './HomepageInvitations'

const HomepagePage = lazy(() => import('../(homepage)/recents/page'))

const homepageErrorTracking = {
  traceError,
  addBreadcrumb: addSentryBreadcrumb,
  isReportable: (error: unknown) => Boolean(getSentryError(error)),
}

export type HomepageHostProps = { application: Application }

/**
 * Resolves what the homepage module needs from the Docs client and injects it. Rendered only on the homepage
 * routes, so the document routes neither run these hooks nor re-render when what they return changes.
 */
export function HomepageHost({ application }: HomepageHostProps) {
  const api = useApi()
  const { APP_VERSION, CLIENT_TYPE } = useConfig()
  const { createNotification } = useNotifications()
  const { getLocalID } = useAuthentication()
  const getAppHrefForUser = useCallback(
    (path: string, app: APP_NAMES) => getAppHref(path, app, getLocalID()),
    [getLocalID],
  )
  const reportDescriptionContext = getDocsReportContextLines({ appVersion: APP_VERSION, clientType: CLIENT_TYPE })
  const reportHomepageTelemetry = useCallback(
    (event: string) => application.metrics.reportHomepageTelemetry(event as TelemetryDocsHomepageEvents),
    [application],
  )
  const isInvitationsSdkEnabled = useInvitationsSdkEnabled()
  const useDocInvites = isInvitationsSdkEnabled ? useDocInvitesSDK : useDocInvitesLegacy
  const isBulkTrashEnabled = useBulkTrashEnabled()
  const isBulkMoveEnabled = useBulkMoveEnabled()
  const featureFlags = useMemo(
    () => ({ bulkTrash: isBulkTrashEnabled, bulkMove: isBulkMoveEnabled }),
    [isBulkTrashEnabled, isBulkMoveEnabled],
  )
  const [addresses] = useAddresses()
  const [contactEmails] = useContactEmails()
  const {
    invitations,
    reloadInvitations,
    loader: invitationsLoader,
  } = useHomepageInvitations(useDocInvites, isInvitationsSdkEnabled ? 'SDK' : 'legacy')
  const { sharingModal, showSharingModal } = useSharingModal()
  const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal()

  return (
    <>
      {invitationsLoader}
      {sharingModal}
      {moveItemsModal}
      {invitations && (
        <Suspense>
          <HomepagePage
            drive={getDrive()}
            eventSubscriber={getEventSubscriber()}
            coreEventSubscriber={getCoreEventSubscriber()}
            pendingInvitations={invitations.pendingInvitations}
            recentlyAcceptedInvitations={invitations.recentlyAcceptedInvitations}
            acceptInvitation={invitations.acceptInvitation}
            declineInvitation={invitations.declineInvitation}
            reloadInvitations={reloadInvitations}
            api={api}
            logger={application.logger}
            reportTelemetry={reportHomepageTelemetry}
            createNotification={createNotification}
            getAppHref={getAppHrefForUser}
            dateLocaleCode={dateLocale.code}
            errorTracking={homepageErrorTracking}
            featureFlags={featureFlags}
            addresses={addresses}
            contactEmails={contactEmails}
            openShareModal={showSharingModal}
            openMoveItemsModal={showMoveItemsModal}
            reportDescriptionContext={reportDescriptionContext}
            quickSettings={<DocsQuickSettings />}
            appVersion={APP_VERSION}
          />
        </Suspense>
      )}
    </>
  )
}
