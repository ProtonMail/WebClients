import ApiProvider from '@proton/components/containers/api/ApiProvider'
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary'
import LoaderPage from '@proton/components/containers/app/LoaderPage'
import ProtonApp from '@proton/components/containers/app/ProtonApp'
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage'
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage'
import AuthenticationProvider from '@proton/components/containers/authentication/Provider'
import EventManagerProvider from '@proton/components/containers/eventManager/EventManagerProvider'
import ModalsChildren from '@proton/components/containers/modals/Children'
import NotificationsChildren from '@proton/components/containers/notifications/Children'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider'
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper'
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error'
import noop from '@proton/utils/noop'
import { FlagProvider } from '@unleash/proxy-client-react'
import { useState } from 'react'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import config from '~/config'
import { useSheetsFavicon } from '../../../../hooks/useSheetsFavicon'
import type { DocsStore } from '~/redux-store/store'
import { extraThunkArguments } from '~/redux-store/thunk'
import { bootstrapPublicApp } from '../../../(public)/__utils/bootstrap'
import { PublicAppRootV2 } from './__components/PublicAppRootV2'

const defaultState: {
  store?: DocsStore
  error?: { message: string } | undefined
  session?: ResumedSessionResult
  hasReadySession?: boolean
} = {
  error: undefined,
  hasReadySession: false,
}

/**
 * The app for a public link on `/doc2`, which the entry renders in place of the public app. Adapted from
 * `applications/docs/src/app/routes/(public)/page.tsx`: the public app's bootstrap and providers, around doc2's root,
 * which hands over to the public app's own root when doc2 is off.
 */
export default function PublicAppV2() {
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
              <PublicAppRootV2 session={session} hasReadySession={hasReadySession} />
            </ErrorBoundary>
          </ApiProvider>
        </EventManagerProvider>
      </FlagProvider>
    </AuthenticationProvider>
  )
}
