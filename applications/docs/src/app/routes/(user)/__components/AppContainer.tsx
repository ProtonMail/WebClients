import GlobalLoader from '@proton/components/components/globalLoader/GlobalLoader'
import GlobalLoaderProvider from '@proton/components/components/globalLoader/GlobalLoaderProvider'
import LocationErrorBoundary from '@proton/components/containers/app/LocationErrorBoundary'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { DriveStoreProvider } from '@proton/drive-store/lib/DriveStoreProvider'
import { useDriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { Suspense, lazy } from 'react'
import { Routes, Route, useSearchParams, Navigate } from 'react-router-dom-v5-compat'

import { ApplicationProvider } from '~/utils/application-context'
import { DocsNotificationsProvider } from '../__utils/notifications-context'
import { DOCUMENT_CREATION_PATHS, DOCUMENT_EDITOR_PATH, DocsUrlContextProvider } from '~/utils/docs-url-bar'
import { useInitializeApplication } from './useInitializeApplication'
import { useCoreEventSubscription } from '~/drive-sdk/core-event-subscriber'
import OpenTracer from '@proton/docs-shared/Tracer/Module'
import { HOMEPAGE_PATHS, HOMEPAGE_RECENTS_PATH } from '../__utils/homepage-paths'

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
        <AppRoutes driveCompat={driveCompat} />
        {driveCompat.modals}
      </DocsNotificationsProvider>
    </ApplicationProvider>
  )
}

// routes
// ------

const HomepagePage = lazy(() => import('../(homepage)/recents/page'))
const DocumentPage = lazy(() => import('../(document)/doc/page'))

type AppRoutesProps = { driveCompat: DriveCompat }

function AppRoutes({ driveCompat }: AppRoutesProps) {
  const documentPage = (
    <Suspense>
      <DocumentPage driveCompat={driveCompat} />
    </Suspense>
  )

  const homepagePage = (
    <Suspense>
      <HomepagePage />
    </Suspense>
  )

  return (
    <Routes>
      {/* document */}
      {DOCUMENT_CREATION_PATHS.map((path) => (
        <Route key={path} path={path} element={documentPage} />
      ))}
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
