import * as bootstrap from '@proton/account/bootstrap'
import createApi from '@proton/shared/lib/api/createApi'
import type { ProtonConfig } from '@proton/shared/lib/interfaces'

import { locales } from '~/utils/locales'
import { extendStore, setupStore } from '~/redux-store/store'
import { createBrowserHistory } from 'history'
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig'
import { requestFork } from '@proton/shared/lib/authentication/fork'
import { APPS } from '@proton/shared/lib/constants'
import { getLastUsedLocalID } from '@proton/account/bootstrap/lastUsedLocalID'
import { readAccountSessions } from '@proton/account/accountSessions/storage'
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { getDecryptedPersistedState } from '@proton/account/persist/helper'
import type { DocsState } from '~/redux-store/rootReducer'
import { getLocalID as _getLocalID } from '@proton/drive-store/utils/url/localid'

function getLocalID(token: string | null) {
  if (token) {
    let localID = -1
    const localIDFromPathname = getLocalIDFromPathname(location.pathname)
    const localIDFromCache = CacheService.getLocalIDForDocumentFromCache({
      token,
    })
    if (localIDFromPathname !== undefined) {
      localID = localIDFromPathname
    } else if (localIDFromCache !== undefined) {
      localID = localIDFromCache
    } else {
      localID = getLastUsedLocalID()
    }
    return localID
  }
  return -1
}

export async function bootstrapPublicApp({ config }: { config: ProtonConfig }) {
  const authentication = bootstrap.createAuthentication()
  bootstrap.init({ config, locales, authentication })

  const store = setupStore()
  const api = createApi({ config })
  const history = createBrowserHistory()
  const unleashClient = bootstrap.createUnleash({ api: getSilentApi(api) })
  extendStore({ config, api, authentication, history, unleashClient })

  const searchParams = new URLSearchParams(location.search)
  const token = searchParams.get('token')
  await bootstrap.publicApp({ app: config.APP_NAME, locales, searchParams, pathLocale: '' })

  const localId = getLocalID(token)

  const accountSessions = readAccountSessions()

  if (localId >= 0 && accountSessions?.some((value) => value.localID === localId)) {
    try {
      const sessionResult = await bootstrap.loadSession({
        authentication,
        api,
        pathname: location.pathname,
        searchParams,
        localID: localId,
        resumeOptions: { user: true },
      })

      const user = sessionResult.session?.User
      const persistedState = await getDecryptedPersistedState<Partial<DocsState>>({
        authentication,
        user,
      })
      const store = setupStore({ preloadedState: persistedState?.state, persist: true })
      /**
       * In some cases sessionResult.session is undefined, but authentication.ready is true, which means
       * there is a session available but not being bootstrapped. Ultimately I don't understand this,
       * but the following is a way to communicate to the caller that we are ultimately working with a valid session.
       */
      return { store, session: sessionResult.session, hasReadySession: authentication.ready }
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
