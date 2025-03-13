import * as bootstrap from '@proton/account/bootstrap'
import createApi from '@proton/shared/lib/api/createApi'
import type { ProtonConfig } from '@proton/shared/lib/interfaces'

import locales from '../../../locales'
import { extendStore, setupStore } from '../../../redux-store/store'
import { createBrowserHistory } from 'history'
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig'
import { requestFork } from '@proton/shared/lib/authentication/fork'
import { APPS } from '@proton/shared/lib/constants'
import { getLocalID } from '@proton/drive-store/utils/url/localid'
import { getLastUsedLocalID } from '@proton/account/bootstrap/lastUsedLocalID'
import { readAccountSessions } from '@proton/account/accountSessions/storage'

export const bootstrapPublicApp = async ({ config }: { config: ProtonConfig }) => {
  const authentication = bootstrap.createAuthentication()
  bootstrap.init({ config, locales, authentication })

  const store = setupStore()
  const api = createApi({ config })
  const history = createBrowserHistory()
  const unleashClient = bootstrap.createUnleash({ api: getSilentApi(api) })
  extendStore({ config, api, authentication, history, unleashClient })

  const searchParams = new URLSearchParams(location.search)
  await bootstrap.publicApp({ app: config.APP_NAME, locales, searchParams, pathLocale: '' })

  const localId = Number(getLocalID() ?? getLastUsedLocalID())
  const accountSessions = readAccountSessions()

  if (localId >= 0 && accountSessions?.some((value) => value.localID === localId)) {
    try {
      await bootstrap.loadSession({ authentication, api, pathname: location.pathname, searchParams })
      // Session loaded fine
    } catch (error) {
      // This session is invalid, we should go back to account to fork it
      if (error instanceof bootstrap.InvalidSessionError) {
        // When the fork returns, we specify to reload the document so that we properly get back in to the public app once the
        // fork has been consumed
        requestFork({ fromApp: APPS.PROTONDOCS, localID: Number(localId), extra: { reloadDocument: true } })
        // Promise that never resolves since request fork is performing a redirect.
        await new Promise(() => {})
      }
      // Otherwise deal with this error however you want. Maybe the server is down or the user's network is offline.
      throw error
    }
  }

  return { store }
}
