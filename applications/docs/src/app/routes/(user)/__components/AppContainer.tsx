import { GlobalLoader, GlobalLoaderProvider, LocationErrorBoundary } from '@proton/components'
import type { DriveCompat } from '@proton/drive-store'
import { DriveStoreProvider, useDriveCompat } from '@proton/drive-store'
import { Suspense, lazy } from 'react'
import { Routes, Route, useSearchParams, Navigate } from 'react-router-dom-v5-compat'

import { ApplicationProvider } from '~/utils/application-context'
import { useFlag } from '@proton/unleash/useFlag'
import { DocsNotificationsProvider } from '../__utils/notifications-context'
import {
  DOCUMENT_NEW_PATH,
  DOCUMENT_CREATION_PATHS,
  DOCUMENT_EDITOR_PATH,
  DocsUrlContextProvider,
} from '~/utils/docs-url-bar'
import { useInitializeApplication } from './useInitializeApplication'

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

export const HOMEPAGE_RECENTS_PATH = '/recents'
export const HOMEPAGE_FAVORITES_PATH = '/favorites'
export const HOMEPAGE_TRASH_PATH = '/trash'
export const HOMEPAGE_PATHS = [HOMEPAGE_RECENTS_PATH, HOMEPAGE_FAVORITES_PATH, HOMEPAGE_TRASH_PATH]

type AppRoutesProps = { driveCompat: DriveCompat }

function AppRoutes({ driveCompat }: AppRoutesProps) {
  const isHomepageEnabled = useFlag('DocsHomepageEnabled')

  const documentPage = (
    <Suspense>
      <DocumentPage driveCompat={driveCompat} />
    </Suspense>
  )

  const homepagePage = isHomepageEnabled ? (
    <Suspense>
      <HomepagePage />
    </Suspense>
  ) : (
    <Navigate to={DOCUMENT_NEW_PATH} replace />
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
      <Route path="*" element={<WildcardRoute isHomepageEnabled={isHomepageEnabled} />} />
    </Routes>
  )
}

type WildcardRouteProps = {
  isHomepageEnabled: boolean
}

function WildcardRoute({ isHomepageEnabled }: WildcardRouteProps) {
  const [searchParams] = useSearchParams()

  const isOpenDocumentLink = searchParams.get('mode')?.includes('open')

  if (isHomepageEnabled && !isOpenDocumentLink) {
    return <Navigate to={HOMEPAGE_RECENTS_PATH} replace />
  }

  return <Navigate to={{ pathname: DOCUMENT_EDITOR_PATH, search: searchParams.toString() }} replace />
}
