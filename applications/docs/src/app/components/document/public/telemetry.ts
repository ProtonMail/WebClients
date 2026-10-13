import { CryptoProxy } from '@protontech/crypto'

import createApi from '@proton/shared/lib/api/createApi'
import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry'
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage'
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface'

import config from '~/config'

const LAST_ACTIVE_PING = 'drive-last-active'

export enum Actions {
  ViewSignUpFlowModal = 'viewSignUpFlowModal',
  DismissSignUpFlowModal = 'dismissSignUpFlowModal',
  SubmitSignUpFlowModal = 'submitSignUpFlowModal',
  SignUpFlowModal = 'signUpFlowModal',
  SignInFlowModal = 'signInFlowModal',
  SignUpFlowAndRedirectCompleted = 'signUpFlowAndRedirectCompleted',
}

const getLastActiveUserId = () => {
  const storageKeys = Object.keys(localStorage)
  let lastActiveUserId = ''
  let lastAccess = 0

  for (const k of storageKeys) {
    if (k.startsWith(LAST_ACTIVE_PING)) {
      const data = JSON.parse(localStorage[k])
      const lastPing = Number(data.value)
      if (lastAccess < lastPing) {
        lastAccess = lastPing
        lastActiveUserId = k.substring(k.indexOf(LAST_ACTIVE_PING) + LAST_ACTIVE_PING.length + 1)
      }
    }
  }
  return lastActiveUserId || null
}

const getLastActivePersistedUserSession = (): PersistedSession | null => {
  try {
    let persistedSession: PersistedSession | null = null
    const lastActiveUserId = getLastActiveUserId()
    const lastPersistedSessionFromPing = getPersistedSessions().find((session) => session.UserID === lastActiveUserId)
    if (lastPersistedSessionFromPing) {
      return lastPersistedSessionFromPing
    }
    for (const data of getPersistedSessions()) {
      if (persistedSession === null || data.persistedAt > persistedSession.persistedAt) {
        persistedSession = data
      }
    }
    return persistedSession
  } catch {
    return null
  }
}

const apiInstance = createApi({ config, sendLocaleHeaders: true })

export const countActionWithTelemetry = (action: Actions, count = 1) => {
  const persistedSession = getLastActivePersistedUserSession()

  if (persistedSession?.UID) {
    apiInstance.UID = persistedSession.UID
  }

  return sendTelemetryReport({
    api: apiInstance,
    measurementGroup: TelemetryMeasurementGroups.driveWebActions,
    event: TelemetryDriveWebFeature.actions,
    values: {
      count,
    },
    dimensions: {
      name: action,
    },
    delay: false,
  })
}

const TEN_MINUTES = 10 * 60 * 1000

async function getTimeBasedHash(interval = TEN_MINUTES) {
  const timeBase = Math.floor(Date.now() / interval) * interval

  const encoder = new TextEncoder()
  const data = encoder.encode(timeBase.toString())
  const hashBuffer = await CryptoProxy.computeHash({ algorithm: 'SHA256', data })
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const traceTelemetry = (action: Actions, duration = TEN_MINUTES) => {
  return {
    start: async () => {
      localStorageWithExpiry.storeData(`telemetry-trace-${action}`, await getTimeBasedHash(duration), duration)
    },
    end: async () => {
      const data = localStorageWithExpiry.getData(`telemetry-trace-${action}`)
      if (data && data === (await getTimeBasedHash(duration))) {
        void countActionWithTelemetry(action)
      }
      localStorageWithExpiry.deleteData(`telemetry-trace-${action}`)
    },
  }
}
