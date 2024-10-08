import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'

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

import * as config from '../../config'
import type { DocsStore } from '../../ReduxStore/store'
import { extraThunkArguments } from '../../ReduxStore/thunk'
import { bootstrapPublicApp } from './PublicBootstrap'
import PublicAppRootContainer from './PublicAppRootContainer'

const defaultState: {
  store?: DocsStore
  error?: { message: string } | undefined
  showDrawerSidebar?: boolean
} = {
  error: undefined,
  showDrawerSidebar: false,
}

const PublicApp = () => {
  const [state, setState] = useState(defaultState)

  useEffectOnce(() => {
    ;(async () => {
      try {
        const { store } = await bootstrapPublicApp({ config })
        setState({ store })
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
            <BrowserRouter>
              <AuthenticationProvider store={extraThunkArguments.authentication}>
                <ApiProvider api={extraThunkArguments.api}>
                  <ErrorBoundary big component={<StandardErrorPage big />}>
                    <div className="h-full">
                      <NotificationsChildren />
                      <ModalsChildren />
                      <PublicAppRootContainer />
                    </div>
                  </ErrorBoundary>
                </ApiProvider>
              </AuthenticationProvider>
            </BrowserRouter>
          </ProtonStoreProvider>
        )
      })()}
    </ProtonApp>
  )
}

export default PublicApp
