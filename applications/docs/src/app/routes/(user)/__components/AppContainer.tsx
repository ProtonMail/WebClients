import GlobalLoader from '@proton/components/components/globalLoader/GlobalLoader'
import GlobalLoaderProvider from '@proton/components/components/globalLoader/GlobalLoaderProvider'
import LocationErrorBoundary from '@proton/components/containers/app/LocationErrorBoundary'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { DriveStoreProvider } from '@proton/drive-store/lib/DriveStoreProvider'
import { useDriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { Application } from '@proton/docs-core/Application/Application'
import { Suspense, lazy } from 'react'
import { Routes, Route, useSearchParams, Navigate } from 'react-router-dom-v5-compat'

import { ApplicationProvider } from '~/utils/application-context'
import { DocsNotificationsProvider } from '../__utils/notifications-context'
import {
  DOCUMENT_CREATION_PATHS,
  DOCUMENT_EDITOR_PATH,
  DOCUMENT_V2_PATHS,
  DocsUrlContextProvider,
} from '~/utils/docs-url-bar'
import { useRealtimeSdkEnabled } from '~/utils/flags'
import { useInitializeApplication } from './useInitializeApplication'
import { useCoreEventSubscription } from '~/drive-sdk/core-event-subscriber'
import OpenTracer from '@proton/docs-shared/Tracer/Module'
import { HOMEPAGE_PATHS, HOMEPAGE_RECENTS_PATH } from '../__utils/homepage-paths'
import { HomepageHost } from './HomepageHost'

// container
// ---------

/**
 * The main container for the user app.
 */
export function AppContainer() {
  return (
    <GlobalLoaderProvider>
      <GlobalLoader />
      <LocationErrorBoundary>
        <DriveStoreProvider>
          <DocsUrlContextProvider>
            <Content />
          </DocsUrlContextProvider>
        </DriveStoreProvider>
      </LocationErrorBoundary>
    </GlobalLoaderProvider>
  )
}

// content
// -------

function Content() {
  const driveCompat = useDriveCompat()
  const application = useInitializeApplication({ driveCompat })
  useCoreEventSubscription()
  return (
    <ApplicationProvider application={application}>
      <DocsNotificationsProvider>
        <AppRoutes driveCompat={driveCompat} application={application} />
        {driveCompat.modals}
      </DocsNotificationsProvider>
    </ApplicationProvider>
  )
}

// routes
// ------

const DocumentPage = lazy(() => import('../(document)/doc/page'))
const DocumentPageV2 = lazy(() => import('../(document)/doc2/page'))

type AppRoutesProps = { driveCompat: DriveCompat; application: Application }

function AppRoutes({ driveCompat, application }: AppRoutesProps) {
  const isRealtimeSdkEnabled = useRealtimeSdkEnabled()

  const documentPage = (
    <Suspense>
      <DocumentPage driveCompat={driveCompat} />
    </Suspense>
  )

  const documentPageV2 = (
    <Suspense>
      <DocumentPageV2 driveCompat={driveCompat} />
    </Suspense>
  )

  const homepagePage = <HomepageHost application={application} />

  return (
    <Routes>
      {/* document */}
      {DOCUMENT_CREATION_PATHS.map((path) => (
        <Route key={path} path={path} element={documentPage} />
      ))}
      {/* document on the realtime SDK, flagged; off, these paths fall through to the wildcard */}
      {isRealtimeSdkEnabled &&
        DOCUMENT_V2_PATHS.map((path) => <Route key={path} path={path} element={documentPageV2} />)}
      {/* homepage */}
      {HOMEPAGE_PATHS.map((path) => (
        <Route key={path} path={path} element={homepagePage} />
      ))}
      {/* catch-all redirect: ?mode=open -> document, else -> homepage */}
      <Route path="*" element={<WildcardRoute />} />
    </Routes>
  )
}

function WildcardRoute() {
  const [searchParams] = useSearchParams()

  const isOpenDocumentLink = searchParams.get('mode')?.includes('open')

  if (!isOpenDocumentLink) {
    void OpenTracer.trace('boot_wildcard_route_navigate_to_homepage')
    return <Navigate to={HOMEPAGE_RECENTS_PATH} replace />
  }

  void OpenTracer.trace('boot_wildcard_route_navigate_to_document_editor')
  return <Navigate to={{ pathname: DOCUMENT_EDITOR_PATH, search: searchParams.toString() }} replace />
}
