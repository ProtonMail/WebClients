import { useApi, useAuthentication, useConfig } from '@proton/components'
import type { DriveCompat } from '@proton/drive-store'
import { useEffect, useMemo } from 'react'
import { Application } from '@proton/docs-core'
import { useUnleashClient } from '@proton/unleash/proxy'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import { getDrive, useDrive } from '@proton/drive'
import { APPS } from '@proton/shared/lib/constants'
import type { LoggerInterface } from '@proton/utils/logs'

import config from '~/config'

export function useInitializeApplication({ driveCompat }: { driveCompat: DriveCompat }) {
  const api = useApi()
  const { API_URL } = useConfig()
  const { UID } = useAuthentication()
  const { init: initializeDriveSDK } = useDrive()
  const unleashClient = useUnleashClient()

  const application = useMemo(() => {
    const application = new Application(
      api,
      undefined,
      {
        apiUrl: API_URL,
        uid: UID,
      },
      new DriveCompatWrapper({ userCompat: driveCompat }),
      config.APP_NAME,
      config.APP_VERSION,
      unleashClient,
    )

    const drive = getDrive()
    // Only initialize if not already initialized
    if (!drive) {
      const logging = loggerFactory(application.logger)
      initializeDriveSDK({
        appName: APPS.PROTONDOCS,
        appVersion: config.APP_VERSION,
        logging,
      })
    }

    return application
    // Ensure only one application instance is created
  }, [])

  useEffect(() => {
    application.updateCompatInstance({ userCompat: driveCompat })
  }, [application, driveCompat])

  return application
}

function loggerFactory(applicationLogger: LoggerInterface) {
  return {
    log: ({
      level,
      loggerName,
      message,
      error,
    }: {
      level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
      loggerName: string
      message: string
      error?: unknown
    }) => {
      const levelToReporter = {
        DEBUG: (args: any[]) => applicationLogger.debug(...args),
        INFO: (args: any[]) => applicationLogger.info(...args),
        WARNING: (args: any[]) => applicationLogger.warn(...args),
        ERROR: (args: any[]) => applicationLogger.error(...args),
      } as const
      const report = levelToReporter[level]
      const formattedMessage = `[Drive SDK][${loggerName}] ${message}`
      if (error) {
        report([formattedMessage, error])
      } else {
        report([formattedMessage])
      }
    },
    getLogs: () => {
      // SDK expects array of strings
      return applicationLogger.getLogs().split('\n')
    },
  }
}
