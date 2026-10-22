import * as bootstrap from '@proton/account/bootstrap'
import { bootstrapEvent } from '@proton/account/bootstrap/action'
import { setupGuestCrossStorage } from '@proton/cross-storage/account/guest'
import { FeatureCode } from '@proton/features/interface'
import { fetchFeatures } from '@proton/features/reducer'
import createApi from '@proton/shared/lib/api/createApi'
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper'
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames'
import { isProduction, traceError } from '@proton/shared/lib/helpers/sentry'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import noop from '@proton/utils/noop'
import { c } from 'ttag'

import { addressesThunk } from '@proton/account/addresses'
import { serverEvent } from '@proton/account/eventLoop'
import { initEvent } from '@proton/account/init'
import { getDecryptedPersistedState } from '@proton/account/persist/helper'
import { startLogoutListener } from '@proton/account/persist/listener'
import { userThunk } from '@proton/account/user'
import { userSettingsThunk } from '@proton/account/userSettings'
import { welcomeFlagsActions } from '@proton/account/welcomeFlags'
import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'
import { CacheService } from '@proton/docs-core/Services/CacheService'
import OpenTracer from '@proton/docs-shared/Tracer/Module'
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout'
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'
import { getCookie } from '@proton/shared/lib/helpers/cookies'
import { appMode } from '@proton/shared/lib/webpack.constants'
import type { DocsState } from '~/redux-store/rootReducer'
import { extendStore, setupStore } from '~/redux-store/store'
import { locales } from '~/utils/locales'

const REFRESH_MESSAGE = 'Please refresh the page.'

class RefreshError extends Error {
  sentryMessage: string = REFRESH_MESSAGE

  constructor(message?: string) {
    super(message || REFRESH_MESSAGE)
    this.name = 'RefreshError'
  }
}

const ERROR_REQUIRE_PAGE_REFRESH = c('Error').t`${DRIVE_APP_NAME} has updated. Please refresh the page.`

const getRefreshError = () => new RefreshError(ERROR_REQUIRE_PAGE_REFRESH)

function sendErrorReport(error: unknown) {
  if (!error || ['AbortError', 'TransferCancel', 'OfflineError'].includes((error as Error).name)) {
    return
  }
  if (getIsConnectionIssue(error)) {
    return
  }

  let errorForReporting = error as Error

  if (error instanceof Error && 'sentryMessage' in error && typeof error.sentryMessage === 'string') {
    errorForReporting = new Error(error.sentryMessage)
    errorForReporting.name = error.name
    errorForReporting.stack = error.stack
  }

  const context: { tags?: Record<string, string> } = {}

  if (typeof window !== 'undefined' && isProduction(window.location.host)) {
    const cookieTag = getCookie('Tag') || 'prod'
    if (cookieTag) {
      context.tags = { stage: cookieTag }
    }
  }

  console.warn(error, context)
  traceError(errorForReporting, context)
}

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

export async function bootstrapApp({ config }: { config: ProtonConfig }) {
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

  void OpenTracer.trace('boot_bootstrap_start')
  void OpenTracer.trace('boot_bootstrap_cookie_shell_start', {
    cookieAtLoad: versionCookieAtLoad,
    cookieLive: getCookie('Tag'),
  })

  if (volumeId && linkId) {
    if (localIDFromPathname !== undefined) {
      localID = localIDFromPathname
      void OpenTracer.trace('boot_bootstrap_localid_resolution_pathname', { localIDFromPathname })
    } else {
      const localIDFromCache = CacheService.getLocalIDForDocumentFromCache({
        volumeId,
        linkId,
      })
      void OpenTracer.trace('boot_bootstrap_localid_resolution_cache', { localIDFromCache })
      localID = localIDFromCache
    }

    void OpenTracer.trace('boot_bootstrap_localid_resolution_complete', { localID })

    // Could not find local ID in pathname or cache
    if (localID === undefined) {
      void OpenTracer.trace('boot_bootstrap_local_id_undefined')
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
    void OpenTracer.trace('boot_bootstrap_session_loaded', { hasSession: !!sessionResult.session })

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

      bootstrap.enableTelemetryBasedOnUserSettings({ userSettings })
      await bootstrap.loadLocales({ userSettings, locales })

      return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope] }
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

    void OpenTracer.trace('boot_bootstrap_user_loaded', {
      earlyAccessEnabled: userData.userSettings?.EarlyAccess,
      earlyAccessScopeValue: userData.earlyAccessScope?.Value,
      earlyAccessScopeDefault: userData.earlyAccessScope?.DefaultValue,
      desyncRetries: sessionStorage.getItem('EARLY_ACCESS_DESYNCHRONIZATION_RETRIES_STORAGE_KEY'),
      cookieAtLoad: versionCookieAtLoad,
      cookieLive: getCookie('Tag'),
    })

    // postLoad needs everything to be loaded.
    await bootstrap.postLoad({ appName, authentication, ...userData, history })
    void OpenTracer.trace('boot_bootstrap_cookie_shell_after_postload', {
      cookieAtLoad: versionCookieAtLoad,
      cookieLive: getCookie('Tag'),
    })

    // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
    await preloadPromise

    const eventManager = bootstrap.eventManager({ api: silentApi })
    extendStore({ eventManager })

    eventManager.subscribe((event) => {
      dispatch(serverEvent(event))
    })
    eventManager.start()

    dispatch(bootstrapEvent({ type: 'complete' }))
    void OpenTracer.trace('boot_bootstrap_complete')

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
