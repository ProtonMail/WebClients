import {
  addressesThunk,
  initEvent,
  serverEvent,
  startLogoutListener,
  userSettingsThunk,
  userThunk,
  welcomeFlagsActions,
} from '@proton/account'
import * as bootstrap from '@proton/account/bootstrap'
import { bootstrapEvent } from '@proton/account/bootstrap/action'
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance'
import { FeatureCode, fetchFeatures } from '@proton/features'
import createApi from '@proton/shared/lib/api/createApi'
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig'
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames'
import type { ProtonConfig } from '@proton/shared/lib/interfaces'
import noop from '@proton/utils/noop'
import { sendErrorReport, getRefreshError } from '@proton/drive-store'

import { locales } from '~/utils/locales'
import { extendStore, setupStore } from '~/redux-store/store'
import { getDecryptedPersistedState } from '@proton/account/persist/helper'
import type { DocsState } from '~/redux-store/rootReducer'
import { appMode } from '@proton/shared/lib/webpack.constants'
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout'

async function getAppContainer() {
  try {
    const { AppContainer } = await import(/* webpackChunkName: "MainContainer" */ '../__components/AppContainer')
    return AppContainer
  } catch (e) {
    console.warn(e)
    sendErrorReport(e)
    return Promise.reject(getRefreshError())
  }
}

export async function bootstrapApp({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) {
  let localID: number | undefined

  const pathname = window.location.pathname
  const localIDFromPathname = getLocalIDFromPathname(pathname)
  const searchParams = new URLSearchParams(window.location.search)
  const volumeId = searchParams.get('volumeId')
  const linkId = searchParams.get('linkId')

  const appName = config.APP_NAME
  const api = createApi({ config })
  const silentApi = getSilentApi(api)
  const authentication = bootstrap.createAuthentication()
  bootstrap.init({ config, authentication, locales })
  setupGuestCrossStorage({ appMode, appName })

  initSafariFontFixClassnames()
  startLogoutListener()

  if (volumeId && linkId) {
    if (localIDFromPathname !== undefined) {
      localID = localIDFromPathname
    } else {
      const localIDFromCache = CacheService.getLocalIDForDocumentFromCache({
        volumeId,
        linkId,
      })
      localID = localIDFromCache
    }

    // Could not find local ID in pathname or cache
    if (localID === undefined) {
      handleInvalidSession({
        appName,
        authentication,
      })
    }
  }

  async function run() {
    const appContainerPromise = getAppContainer()
    const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams, localID })
    const history = bootstrap.createHistory({ sessionResult, pathname })
    const unleashClient = bootstrap.createUnleash({ api: silentApi })

    const user = sessionResult.session?.User
    extendStore({ config, api, authentication, unleashClient, history })

    const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop)

    const persistedState = await getDecryptedPersistedState<Partial<DocsState>>({
      authentication,
      user,
    })

    const store = setupStore({ preloadedState: persistedState?.state, persist: true })
    const dispatch = store.dispatch

    if (user) {
      dispatch(initEvent({ User: user }))
    }

    const loadUser = async () => {
      const [user, userSettings, features] = await Promise.all([
        dispatch(userThunk()),
        dispatch(userSettingsThunk()),
        dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
      ])

      dispatch(welcomeFlagsActions.initial(userSettings))

      const [scopes] = await Promise.all([
        bootstrap.initUser({ appName, user, userSettings }),
        bootstrap.loadLocales({ userSettings, locales }),
      ])

      return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes }
    }

    const loadPreload = () => {
      return dispatch(addressesThunk())
    }

    const userPromise = loadUser()
    const preloadPromise = loadPreload()

    const [MainContainer, userData] = await Promise.all([
      appContainerPromise,
      userPromise,
      bootstrap.loadCrypto({ appName, unleashClient }),
      unleashPromise,
    ])
    // postLoad needs everything to be loaded.
    await bootstrap.postLoad({ appName, authentication, ...userData, history })
    // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
    await preloadPromise

    const eventManager = bootstrap.eventManager({ api: silentApi })
    extendStore({ eventManager })
    const unsubscribeEventManager = eventManager.subscribe((event) => {
      dispatch(serverEvent(event))
    })
    eventManager.start()

    bootstrap.onAbort(signal, () => {
      unsubscribeEventManager()
      eventManager.reset()
      unleashClient.stop()
      store.unsubscribe()
    })

    dispatch(bootstrapEvent({ type: 'complete' }))

    return {
      ...userData,
      eventManager,
      unleashClient,
      history,
      store,
      MainContainer,
    }
  }

  return bootstrap.wrap({ appName, authentication }, run())
}
