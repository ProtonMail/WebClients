import { GlobalLoader, GlobalLoaderProvider, LocationErrorBoundary } from '@proton/components'
import type { DriveCompat } from '@proton/drive-store'
import { DriveStoreProvider } from '@proton/drive-store'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { useApi, useAuthentication, useConfig } from '@proton/components'
import { Application } from '@proton/docs-core'
import { useDriveCompat } from '@proton/drive-store'

import { APP_VERSION } from '~/config'
import { ApplicationProvider } from '~/utils/application-context'
import { useFlag, useUnleashClient } from '@proton/unleash'
import { DocsNotificationsProvider } from '../__utils/notifications-context'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'

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
      APP_VERSION,
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

function useHomepageFeatureFlag() {
  return useFlag('DriveDocsLandingPageEnabled')
}

const HomepagePage = lazy(() => import('../(homepage)/most-recent/page'))
const DocumentPage = lazy(() => import('../(document)/doc/page'))

type AppRoutesProps = { driveCompat: DriveCompat }

function AppRoutes({ driveCompat }: AppRoutesProps) {
  const isHomepageEnabled = useHomepageFeatureFlag()
  return (
    <Switch>
      {/* document */}
      <Route path={['/doc', '/new']}>
        <Suspense>
          <DocumentPage driveCompat={driveCompat} />
        </Suspense>
      </Route>
      {/* homepage */}
      <Route path={['/most-recent', '/owned-by-me', '/owned-by-others']}>
        {isHomepageEnabled ? (
          <Suspense>
            <HomepagePage />
          </Suspense>
        ) : (
          <Redirect to="/new" />
        )}
      </Route>
      {/* catch-all redirect: ?mode=open -> document, else -> homepage */}
      <Route
        path="*"
        render={(props) => {
          const isOpenDocumentLink = props.location.search.includes('mode=open')
          return isHomepageEnabled && !isOpenDocumentLink ? (
            <Redirect to="/most-recent" />
          ) : (
            <Redirect to={{ pathname: '/doc', search: props.location.search }} />
          )
        }}
      />
    </Switch>
  )
}
