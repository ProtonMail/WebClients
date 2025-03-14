import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { useApi, useAuthentication, useConfig } from '@proton/components'
import { Application } from '@proton/docs-core'
import { useDriveCompat } from '@proton/drive-store'

import { APP_VERSION } from '../../../config'
import ApplicationProvider from '../../../Containers/ApplicationProvider'
import { useFlag, useUnleashClient } from '@proton/unleash'
import { DocsNotificationsProvider } from '../../../Containers/DocsNotificationsProvider'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'

function useHomepageFeatureFlag() {
  return useFlag('DriveDocsLandingPageEnabled')
}

const HomepageRoute = lazy(() => import('../../../components/Homepage/HomepageRoute'))
const UserDocumentPage = lazy(() => import('../(document)/doc/page'))

export function UserAppContent() {
  const api = useApi()
  const driveCompat = useDriveCompat()
  const { API_URL } = useConfig()
  const { UID } = useAuthentication()
  const isHomepageEnabled = useHomepageFeatureFlag()

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

  return (
    <ApplicationProvider application={application}>
      <DocsNotificationsProvider>
        <Switch>
          <Route path={['/doc', '/new']}>
            <Suspense>
              <UserDocumentPage driveCompat={driveCompat} />
            </Suspense>
          </Route>
          <Route path={['/most-recent', '/owned-by-me', '/owned-by-others']}>
            {isHomepageEnabled ? (
              <Suspense>
                <HomepageRoute />
              </Suspense>
            ) : (
              <Redirect to="/new" />
            )}
          </Route>
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
        {driveCompat.modals}
      </DocsNotificationsProvider>
    </ApplicationProvider>
  )
}
