import { useState } from 'react'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { FlagProvider } from '@proton/unleash'

import {
  ApiProvider,
  AuthenticationProvider,
  ErrorBoundary,
  EventManagerProvider,
  LoaderPage,
  ModalsChildren,
  NotificationsChildren,
  ProtonApp,
  StandardErrorPage,
  StandardLoadErrorPage,
} from '@proton/components'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { ProtonStoreProvider } from '@proton/redux-shared-store'
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error'
import noop from '@proton/utils/noop'

import config from '~/config'
import type { DocsStore } from '~/redux-store/store'
import { extraThunkArguments } from '~/redux-store/thunk'
import { bootstrapPublicApp } from './__utils/bootstrap'
import { PublicAppRootContainer } from './__components/PublicAppRootContainer'
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper'
import { useSheetsFavicon } from '../../hooks/useSheetsFavicon'

const defaultState: {
  store?: DocsStore
  error?: { message: string } | undefined
  showDrawerSidebar?: boolean
  session?: ResumedSessionResult
  hasReadySession?: boolean
} = {
  error: undefined,
  showDrawerSidebar: false,
  hasReadySession: false,
}

export default function PublicApp() {
  const [state, setState] = useState(defaultState)

  useEffectOnce(() => {
    ;(async () => {
      try {
        const { store, session, hasReadySession } = await bootstrapPublicApp({ config })
        setState({ store, session, hasReadySession })
      } catch (error: any) {
        setState({
          error: getNonEmptyErrorMessage(error),
        })
      }
    })().catch(noop)
  })

  return (
    <ProtonApp config={config}>
      {(() => {
        if (state.error) {
          return <StandardLoadErrorPage errorMessage={state.error.message} />
        }
        if (!state.store) {
          return <LoaderPage />
        }

        return (
          <ProtonStoreProvider store={state.store}>
            <Router history={extraThunkArguments.history}>
              <CompatRouter>
                <PublicAppContainer session={state.session} hasReadySession={state.hasReadySession ?? false} />
              </CompatRouter>
            </Router>
          </ProtonStoreProvider>
        )
      })()}
    </ProtonApp>
  )
}

function PublicAppContainer({
  session,
  hasReadySession,
}: {
  session?: ResumedSessionResult
  hasReadySession: boolean
}) {
  useSheetsFavicon()

  return (
    <AuthenticationProvider store={extraThunkArguments.authentication}>
      <FlagProvider unleashClient={extraThunkArguments.unleashClient}>
        <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
          <ApiProvider api={extraThunkArguments.api}>
            <ErrorBoundary big component={<StandardErrorPage big />}>
              <NotificationsChildren />
              <ModalsChildren />
              <PublicAppRootContainer session={session} hasReadySession={hasReadySession} />
            </ErrorBoundary>
          </ApiProvider>
        </EventManagerProvider>
      </FlagProvider>
    </AuthenticationProvider>
  )
}
