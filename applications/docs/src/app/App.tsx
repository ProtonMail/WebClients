import { FunctionComponent, useState } from 'react'
import { Router } from 'react-router-dom'

import FlagProvider from '@unleash/proxy-client-react'

import {
  ApiProvider,
  AuthenticationProvider,
  DelinquentContainer,
  DrawerProvider,
  ErrorBoundary,
  EventManagerProvider,
  LoaderPage,
  ProtonApp,
  StandardErrorPage,
  StandardLoadErrorPage,
  StandardPrivateApp,
} from '@proton/components'
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import metrics from '@proton/metrics'
import { ProtonStoreProvider } from '@proton/redux-shared-store'
import { getClientID } from '@proton/shared/lib/apps/helper'
import { newVersionUpdater } from '@proton/shared/lib/busy'
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error'
import { setTtagLocales } from '@proton/shared/lib/i18n/locales'
import { DRAWER_VISIBILITY, UserModel } from '@proton/shared/lib/interfaces'

import { bootstrapApp } from './bootstrap'
import * as config from './config'
import locales from './locales'
import { DocsStore } from './ReduxStore/store'
import { extraThunkArguments } from './ReduxStore/thunk'
import { Availability, AvailabilityReport, AvailabilityTypes } from '@proton/utils/availability'
import { DocsThemeProvider } from './DocsThemeProvider'

setTtagLocales(locales)
setupGuestCrossStorage()
newVersionUpdater(config)

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION)

const defaultState: {
  initialUser?: UserModel
  store?: DocsStore
  MainContainer?: FunctionComponent
  error?: { message: string } | undefined
  showDrawerSidebar?: boolean
} = {
  error: undefined,
  showDrawerSidebar: false,
}

const App = () => {
  const [state, setState] = useState(defaultState)

  useEffectOnce(() => {
    void (async () => {
      try {
        /*
                  Availability will report every 5 minutes the user status:
                  - if an error occured and was reported to Sentry
                  - if an error occured and was explicitely marked as an error
                  - if an error occurred and was explicitely marked as critical
                */
        Availability.init((report: AvailabilityReport) => {
          metrics.docs_users_success_rate_total.increment({
            plan: state.initialUser?.isFree ? 'free' : 'paid',
            critical: report[AvailabilityTypes.CRITICAL] ? 'true' : 'false',
            error: report[AvailabilityTypes.ERROR] ? 'true' : 'false',
            sentry: report[AvailabilityTypes.SENTRY] ? 'true' : 'false',
          })
        })

        const { scopes, user, userSettings, MainContainer, store } = await bootstrapApp({
          config,
        })

        setState({
          store,
          MainContainer: scopes.delinquent ? DelinquentContainer : MainContainer,
          showDrawerSidebar: userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW,
          initialUser: user,
        })
      } catch (error: any) {
        setState({
          error: {
            message: getNonEmptyErrorMessage(error),
          },
        })
      }
    })()
  })

  return (
    <ProtonApp config={config} ThemeProvider={DocsThemeProvider}>
      {(() => {
        if (state.error) {
          return <StandardLoadErrorPage errorMessage={state.error.message} />
        }

        const loader = <LoaderPage />
        if (!state.MainContainer || !state.store || !state.initialUser) {
          return loader
        }

        return (
          <ProtonStoreProvider store={state.store}>
            <AuthenticationProvider store={extraThunkArguments.authentication}>
              <ApiProvider api={extraThunkArguments.api}>
                <DrawerProvider defaultShowDrawerSidear={state.showDrawerSidebar}>
                  <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                    <Router history={extraThunkArguments.history}>
                      <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                        <ErrorBoundary big component={<StandardErrorPage big />}>
                          <StandardPrivateApp
                            hasReadableMemberKeyActivation
                            hasMemberKeyMigration
                            hasPrivateMemberKeyGeneration
                            loader={loader}
                          >
                            <state.MainContainer />
                          </StandardPrivateApp>
                        </ErrorBoundary>
                      </EventManagerProvider>
                    </Router>
                  </FlagProvider>
                </DrawerProvider>
              </ApiProvider>
            </AuthenticationProvider>
          </ProtonStoreProvider>
        )
      })()}
    </ProtonApp>
  )
}

export default App
