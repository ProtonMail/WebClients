import {
  updateVersionCookie,
  deleteVersionCookies,
  versionCookieAtLoad,
} from '@proton/components/helpers/versionCookie'

const ENABLED = true // feature killswitch
const TAG_SYNC_RELOAD_ATTEMPTS = 2
const TAG_SYNC_RELOAD_ATTEMPTS_KEY = 'docs-editor-tag-sync'

export enum SyncBundleResult {
  READY = 'ready',
  RELOADING = 'reloading',
  FAILED = 'failed',
}

/**
 * Checks the intended environment and the current bundle version.
 * It will attempt to reload the page until intended environment is received.
 * If reload attempts exceed the limit, it will return failed.
 */
export function syncBundle(): SyncBundleResult {
  if (!ENABLED) {
    return SyncBundleResult.READY
  }

  const searchParams = new URLSearchParams(window.location.search)
  const passedTag = searchParams.get('tag')

  const isEarlyAccessEnvironment = passedTag === 'alpha' || passedTag === 'beta'
  const intendedEnvironment = isEarlyAccessEnvironment ? passedTag : undefined

  if (intendedEnvironment === versionCookieAtLoad) {
    sessionStorage.removeItem(TAG_SYNC_RELOAD_ATTEMPTS_KEY)
    return SyncBundleResult.READY
  }

  const syncAttempts = Number(sessionStorage.getItem(TAG_SYNC_RELOAD_ATTEMPTS_KEY) ?? 0)
  if (syncAttempts >= TAG_SYNC_RELOAD_ATTEMPTS) {
    sessionStorage.removeItem(TAG_SYNC_RELOAD_ATTEMPTS_KEY)
    return SyncBundleResult.FAILED
  }

  sessionStorage.setItem(TAG_SYNC_RELOAD_ATTEMPTS_KEY, String(syncAttempts + 1))
  if (isEarlyAccessEnvironment) {
    updateVersionCookie(intendedEnvironment, undefined)
  } else {
    deleteVersionCookies()
  }

  window.location.reload()
  return SyncBundleResult.RELOADING
}
