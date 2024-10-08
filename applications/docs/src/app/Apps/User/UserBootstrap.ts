import {
  addressesThunk,
  initEvent,
  serverEvent,
  userSettingsThunk,
  userThunk,
  welcomeFlagsActions,
} from '@proton/account'
import * as bootstrap from '@proton/account/bootstrap'
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance'
import { FeatureCode, fetchFeatures } from '@proton/features'
import createApi from '@proton/shared/lib/api/createApi'
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig'
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames'
import type { ProtonConfig } from '@proton/shared/lib/interfaces'
import noop from '@proton/utils/noop'
import { sendErrorReport, getRefreshError } from '@proton/drive-store'

import locales from '../../locales'
import { extendStore, setupStore } from '../../ReduxStore/store'

const getAppContainer = () =>
  import(/* webpackChunkName: "MainContainer" */ './UserAppRootContainer')
    .then((result) => result.default)
    .catch((e) => {
      console.warn(e)
      sendErrorReport(e)

      return Promise.reject(getRefreshError())
    })

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
  const pathname = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)
  const api = createApi({ config })
  const silentApi = getSilentApi(api)
  const authentication = bootstrap.createAuthentication()
  bootstrap.init({ config, authentication, locales })
  setupGuestCrossStorage()
  const appName = config.APP_NAME

  initSafariFontFixClassnames()

  const run = async () => {
    const appContainerPromise = getAppContainer()
    const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams })
    const history = bootstrap.createHistory({ sessionResult, pathname })
    const unleashClient = bootstrap.createUnleash({ api: silentApi })

    const user = sessionResult.session?.User
    extendStore({ config, api, authentication, unleashClient, history })
    const store = setupStore()
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
    const evPromise = bootstrap.eventManager({ api: silentApi })
    const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop)

    await unleashPromise
    // Needs unleash to be loaded.
    await bootstrap.loadCrypto({ appName, unleashClient })
    const [MainContainer, userData, eventManager] = await Promise.all([appContainerPromise, userPromise, evPromise])
    // Needs everything to be loaded.
    await bootstrap.postLoad({ appName, authentication, ...userData, history })
    // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
    await preloadPromise

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
