import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { useApi, useAuthentication, useConfig } from '@proton/components'
import { Application } from '@proton/docs-core'
import { useDriveCompat } from '@proton/drive-store'

import { useLandingPageFeatureFlag } from '../../Components/Homepage/useLandingPageFeatureFlag'
import { APP_VERSION } from '../../config'
import ApplicationProvider from '../../Containers/ApplicationProvider'
import { useUnleashClient } from '@proton/unleash'
import { DocsNotificationsProvider } from '../../Containers/DocsNotificationsProvider'

const HomepageRoute = lazy(() => import('../../Components/Homepage/HomepageRoute'))
const SingleDocumentRoute = lazy(() => import('./SingleDocumentRoute'))

function UserAppContent() {
  const api = useApi()
  const driveCompat = useDriveCompat()
  const { API_URL } = useConfig()
  const { UID } = useAuthentication()
  const isLandingPageEnabled = useLandingPageFeatureFlag()

  const unleashClient = useUnleashClient()

  const application = useMemo(() => {
    return new Application(
      api,
      undefined,
      {
        apiUrl: API_URL,
        uid: UID,
      },
      { userCompat: driveCompat },
      APP_VERSION,
      unleashClient,
    )
    // Ensure only one application instance is created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    application.updateCompatWrapper({ userCompat: driveCompat })
  }, [application, driveCompat])

  return (
    <ApplicationProvider application={application}>
      <DocsNotificationsProvider>
        <Switch>
          <Route path={'/doc'}>
            <Suspense>
              <SingleDocumentRoute driveCompat={driveCompat} />
            </Suspense>
          </Route>
          <Route path={['/most-recent', '/owned-by-me', '/owned-by-others']}>
            {isLandingPageEnabled ? (
              <Suspense>
                <HomepageRoute />
              </Suspense>
            ) : (
              <Redirect to="/doc" />
            )}
          </Route>
          <Route
            path="*"
            render={(props) => {
              const isOpenDocumentLink = props.location.search.includes('mode=open')
              return isLandingPageEnabled && !isOpenDocumentLink ? (
                <Redirect to="/most-recent" />
              ) : (
                <Redirect to={{ pathname: '/doc', search: props.location.search }} />
              )
            }}
          />
        </Switch>
        {driveCompat.modals}
      </DocsNotificationsProvider>
    </ApplicationProvider>
  )
}

export default UserAppContent
