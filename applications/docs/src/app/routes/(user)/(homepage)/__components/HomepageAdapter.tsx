import { useDocInvites as useDocInvitesLegacy } from '@proton/drive-store/lib/_invites/useDocInvites'
import { getDrive } from '@proton/drive/sdk'
import { useSharingModal } from '@proton/drive/public/sharingModal'
import { useMoveItemsModal } from '@proton/drive/public/moveItemsModal'
import { useApi } from '@proton/app-context/useApi'
import { useNotifications } from '@proton/app-context/useNotifications'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { useAddresses } from '@proton/account/addresses/hooks'
import { useContactEmails } from '@proton/account/contactEmails/hooks'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import type { APP_NAMES } from '@proton/shared/lib/constants'
import { dateLocale } from '@proton/shared/lib/i18n'
import { addSentryBreadcrumb, getSentryError, traceError } from '@proton/shared/lib/helpers/sentry'
import type { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { type ReactNode, useCallback, useMemo } from 'react'

import { HomepageDependenciesProvider } from '~/homepage'
import { useApplication } from '~/utils/application-context'
import { useBulkMoveEnabled, useBulkTrashEnabled, useInvitationsSdkEnabled } from '~/utils/flags'
import { getCoreEventSubscriber } from '~/drive-sdk/core-event-subscriber'
import { getEventSubscriber } from '~/drive-sdk/event-subscriber'
import { useDocInvites as useDocInvitesSDK } from '~/drive-sdk/useDocInvites'
import { useHomepageLocalization } from '../__utils/useHomepageLocalization'
import { toHomepageDateFormat } from '../__utils/toHomepageDateFormat'
import { useHomepageInvitations } from './HomepageInvitations'
import { withNotificationAction } from './withNotificationAction'

const homepageErrorTracking = {
  traceError,
  addBreadcrumb: addSentryBreadcrumb,
  isReportable: (error: unknown) => Boolean(getSentryError(error)),
}

export type HomepageAdapterProps = { children: ReactNode }

/**
 * Collects the homepage's dependencies from the Docs client and provides them to `children`, once the invitations
 * have loaded. Rendered only on the homepage routes, so the document routes neither run these hooks nor re-render
 * when what they return changes.
 */
export function HomepageAdapter({ children }: HomepageAdapterProps) {
  const application = useApplication()
  const api = useApi()
  const { createNotification } = useNotifications()
  const createHomepageNotification = useMemo(() => withNotificationAction(createNotification), [createNotification])
  const { getLocalID } = useAuthentication()
  const getAppHrefForUser = useCallback(
    (path: string, app: APP_NAMES) => getAppHref(path, app, getLocalID()),
    [getLocalID],
  )
  const reportHomepageTelemetry = useCallback(
    (event: string) => application.metrics.reportHomepageTelemetry(event as TelemetryDocsHomepageEvents),
    [application],
  )
  const messages = useHomepageLocalization()
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
        <HomepageDependenciesProvider
          // Not memoized, unlike DocsAdapter's: HomepageDependenciesProvider reads the object field by field, so only
          // each field's identity matters. Keep the fields stable: a new api, drive, logger, errorTracking,
          // eventSubscriber or createNotification reloads the recents, and memoizing the object wouldn't prevent that.
          dependencies={{
            drive: getDrive(),
            eventSubscriber: getEventSubscriber(),
            coreEventSubscriber: getCoreEventSubscriber(),
            ...invitations,
            reloadInvitations,
            api,
            logger: application.logger,
            reportTelemetry: reportHomepageTelemetry,
            createNotification: createHomepageNotification,
            getAppHref: getAppHrefForUser,
            // Read on render: once a locale change has loaded the date locale, StandardPrivateApp remounts the app.
            dateFormat: toHomepageDateFormat(dateLocale),
            errorTracking: homepageErrorTracking,
            featureFlags,
            addresses,
            contactEmails,
            messages,
            openShareModal: showSharingModal,
            openMoveItemsModal: showMoveItemsModal,
          }}
        >
          {children}
        </HomepageDependenciesProvider>
      )}
    </>
  )
}
