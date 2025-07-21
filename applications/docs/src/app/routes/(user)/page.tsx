import type { FunctionComponent, ReactNode } from 'react'
import { useContext, useState } from 'react'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { FlagProvider } from '@proton/unleash'

import {
  type CreateNotificationOptions,
  type NotificationsContextValue,
  ApiProvider,
  AuthenticationProvider,
  DelinquentContainer,
  DrawerProvider,
  ErrorBoundary,
  EventManagerProvider,
  getThemeStyle,
  LoaderPage,
  NotificationsContext,
  ProtonApp,
  StandardErrorPage,
  StandardLoadErrorPage,
  StandardPrivateApp,
} from '@proton/components'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import metrics from '@proton/metrics'
import { ProtonStoreProvider } from '@proton/redux-shared-store'
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error'
import type { UserModel } from '@proton/shared/lib/interfaces'
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces'

import { bootstrapApp } from './__utils/bootstrap'
import config from '~/config'
import type { DocsStore } from '~/redux-store/store'
import { extraThunkArguments } from '~/redux-store/thunk'
import type { AvailabilityReport } from '@proton/utils/availability'
import { Availability, AvailabilityTypes } from '@proton/utils/availability'
import type { APP_NAMES } from '@proton/shared/lib/constants'
import { UserSettingsProvider } from '@proton/drive-store/store'
import { useSheetsFavicon } from '../../hooks/useSheetsFavicon'

/**
 * The entry point for the user (authenticated) application.
 */
export default function UserApp() {
  const appState = useAppState()
  return (
    <ProtonApp config={config} ThemeProvider={DocsThemeProvider}>
      {(() => {
        const { error, MainContainer, store, initialUser, showDrawerSidebar } = appState
        if (error) {
          return <StandardLoadErrorPage errorMessage={error.message} />
        }

        const loader = <LoaderPage />
        if (!MainContainer || !store || !initialUser) {
          return loader
        }

        return (
          <OuterContainer store={store} showDrawerSidebar={showDrawerSidebar} initialUser={initialUser}>
            {/* Normally, this will render AppContainer. Routing is handled by AppRoutes. */}
            <MainContainer />
          </OuterContainer>
        )
      })()}
    </ProtonApp>
  )
}

// app state
// ---------

type AppState = {
  initialUser?: UserModel
  store?: DocsStore
  MainContainer?: FunctionComponent
  error?: { message: string } | undefined
  showDrawerSidebar?: boolean
}

const DEFAULT_APP_STATE: AppState = {
  error: undefined,
  showDrawerSidebar: false,
}

function useAppState() {
  const [state, setState] = useState(DEFAULT_APP_STATE)

  useEffectOnce(() => {
    void (async () => {
      try {
        /*
          Availability will report every 5 minutes the user status:
          - if an error occurred and was reported to Sentry
          - if an error occurred and was explicitly marked as an error
          - if an error occurred and was explicitly marked as critical
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
        setState({ error: { message: getNonEmptyErrorMessage(error) } })
      }
    })()
  })
  return state
}

// outer container
// ---------------

const HIDDEN_NOTIFICATIONS = [
  'Requested data does not exist or you do not have permission to access it',
  'Shared drive not found',
]

type OuterContainerProps = {
  store: DocsStore
  showDrawerSidebar?: boolean
  initialUser: UserModel
  children: ReactNode
}

function OuterContainer({ store, showDrawerSidebar, initialUser, children }: OuterContainerProps) {
  return (
    <ProtonStoreProvider store={store}>
      <CustomNotificationsHijack ignoredNotifications={HIDDEN_NOTIFICATIONS}>
        <AuthenticationProvider store={extraThunkArguments.authentication}>
          <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
            <Router history={extraThunkArguments.history}>
              <CompatRouter>
                <RouterDependentContainer showDrawerSidebar={showDrawerSidebar} initialUser={initialUser}>
                  {children}
                </RouterDependentContainer>
              </CompatRouter>
            </Router>
          </FlagProvider>
        </AuthenticationProvider>
      </CustomNotificationsHijack>
    </ProtonStoreProvider>
  )
}

function RouterDependentContainer({
  showDrawerSidebar,
  initialUser,
  children,
}: {
  showDrawerSidebar?: boolean
  initialUser: UserModel
  children: ReactNode
}) {
  useSheetsFavicon()

  return (
    <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
      <ApiProvider api={extraThunkArguments.api}>
        {/* TODO: fix typo globally */}
        <DrawerProvider defaultShowDrawerSidear={showDrawerSidebar}>
          <ErrorBoundary big component={<StandardErrorPage big />}>
            {/* TODO: remove this once the temporary "Trash" homepage view implementation is cleaned up */}
            <UserSettingsProvider
              initialUser={initialUser}
              initialDriveUserSettings={{
                Defaults: {
                  RevisionRetentionDays: 0,
                  B2BPhotosEnabled: false,
                  PhotoTags: [],
                },
                UserSettings: {
                  Sort: null,
                  Layout: null,
                  RevisionRetentionDays: null,
                  B2BPhotosEnabled: null,
                  PhotoTags: null,
                },
              }}
            >
              <StandardPrivateApp>{children}</StandardPrivateApp>
            </UserSettingsProvider>
          </ErrorBoundary>
        </DrawerProvider>
      </ApiProvider>
    </EventManagerProvider>
  )
}

// theme provider
// --------------

const THEME_ID = 'theme-root'
const DEFAULT_THEME_STYLES = getThemeStyle()

type DocsThemeProviderProps = { children: ReactNode; appName: APP_NAMES }

function DocsThemeProvider({ children }: DocsThemeProviderProps) {
  return (
    <>
      <style id={THEME_ID}>{DEFAULT_THEME_STYLES}</style>
      {children}
    </>
  )
}

// custom notifications hijack
// ---------------------------

type CustomNotificationsHijackProps = {
  ignoredNotifications: string[]
  children?: ReactNode
}

function CustomNotificationsHijack({ children, ignoredNotifications }: CustomNotificationsHijackProps) {
  const parentContext = useContext(NotificationsContext)

  const hijackedCreateNotification = (options: CreateNotificationOptions) => {
    if (options.text && typeof options.text === 'string' && ignoredNotifications.includes(options.text)) {
      /* createNotification has to return a number */
      return 42
    }
    return parentContext.createNotification(options)
  }

  const context: NotificationsContextValue = {
    ...parentContext,
    createNotification: hijackedCreateNotification,
  }

  return <NotificationsContext.Provider value={context}>{children}</NotificationsContext.Provider>
}
