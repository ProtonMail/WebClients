import { GlobalLoader, GlobalLoaderProvider, LocationErrorBoundary } from '@proton/components'
import type { DriveCompat } from '@proton/drive-store'
import { DriveStoreProvider } from '@proton/drive-store'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Routes, Route, useSearchParams, Navigate } from 'react-router-dom-v5-compat'

import { useApi, useAuthentication, useConfig } from '@proton/components'
import { Application } from '@proton/docs-core'
import { useDriveCompat } from '@proton/drive-store'

import config from '~/config'
import { ApplicationProvider } from '~/utils/application-context'
import { useFlag, useUnleashClient } from '@proton/unleash'
import { DocsNotificationsProvider } from '../__utils/notifications-context'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import { DOCUMENT_NEW_PATH, DOCUMENT_CREATION_PATHS, DOCUMENT_EDITOR_PATH } from '~/utils/docs-url-bar'

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
          <Content />
        </DriveStoreProvider>
      </LocationErrorBoundary>
    </GlobalLoaderProvider>
  )
}

// content
// -------

function Content() {
  const driveCompat = useDriveCompat()
  const application = useApplication({ driveCompat })
  return (
    <ApplicationProvider application={application}>
      <DocsNotificationsProvider>
        <AppRoutes driveCompat={driveCompat} />
        {driveCompat.modals}
      </DocsNotificationsProvider>
    </ApplicationProvider>
  )
}

// application
// -----------

type ApplicationOptions = { driveCompat: DriveCompat }

function useApplication({ driveCompat }: ApplicationOptions) {
  const api = useApi()
  const { API_URL } = useConfig()
  const { UID } = useAuthentication()

  const unleashClient = useUnleashClient()

  const application = useMemo(() => {
    return new Application(
      api,
      undefined,
      {
        apiUrl: API_URL,
        uid: UID,
      },
      new DriveCompatWrapper({ userCompat: driveCompat }),
      config.APP_VERSION,
      unleashClient,
    )
    // Ensure only one application instance is created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    application.updateCompatInstance({ userCompat: driveCompat })
  }, [application, driveCompat])

  return application
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
