import { useState } from 'react'
import { Router } from 'react-router-dom'
import { FlagProvider } from '@proton/unleash'

import {
  ApiProvider,
  AuthenticationProvider,
  ErrorBoundary,
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

import * as config from '~/config'
import type { DocsStore } from '~/redux-store/store'
import { extraThunkArguments } from '~/redux-store/thunk'
import { bootstrapPublicApp } from './__utils/bootstrap'
import { PublicAppRootContainer } from './__components/PublicAppRootContainer'
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper'

const defaultState: {
  store?: DocsStore
  error?: { message: string } | undefined
  showDrawerSidebar?: boolean
  session?: ResumedSessionResult
} = {
  error: undefined,
  showDrawerSidebar: false,
}

export default function PublicApp() {
  const [state, setState] = useState(defaultState)

  useEffectOnce(() => {
    ;(async () => {
      try {
        const { store, session } = await bootstrapPublicApp({ config })
        setState({ store, session })
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
              <AuthenticationProvider store={extraThunkArguments.authentication}>
                <FlagProvider unleashClient={extraThunkArguments.unleashClient}>
                  <ApiProvider api={extraThunkArguments.api}>
                    <ErrorBoundary big component={<StandardErrorPage big />}>
                      <div className="h-full">
                        <NotificationsChildren />
                        <ModalsChildren />
                        <PublicAppRootContainer session={state.session} />
                      </div>
                    </ErrorBoundary>
                  </ApiProvider>
                </FlagProvider>
              </AuthenticationProvider>
            </Router>
          </ProtonStoreProvider>
        )
      })()}
    </ProtonApp>
  )
}
