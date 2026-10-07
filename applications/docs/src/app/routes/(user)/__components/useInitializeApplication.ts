import { useApi } from '@proton/app-context/useApi'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { useConfig } from '@proton/app-context/useConfig'
import type { DriveCompat } from '@proton/drive-store'
import { useEffect, useMemo } from 'react'
import { Application } from '@proton/docs-core'
import { useUnleashClient } from '@proton/unleash/proxy'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import { getDrive, useDrive } from '@proton/drive'
import { APPS } from '@proton/shared/lib/constants'
import config from '~/config'
import { loggerForSDK } from '~/drive-sdk/logger'
import { useGetCacheConfig } from '@proton/docs-core/lib/Crypto/useGetCacheConfig'
import { useGetVerificationKey } from '@proton/docs-core/lib/Crypto/useGetVerificationKey'
import { isDriveCompatSDKEnabled } from '@proton/docs-core/lib/Util/isDriveCompatSDKEnabled'

export function useInitializeApplication({ driveCompat }: { driveCompat: DriveCompat }) {
  const api = useApi()
  const { API_URL } = useConfig()
  const { UID } = useAuthentication()
  const { init: initializeDriveSDK } = useDrive()
  const unleashClient = useUnleashClient()
  const getCacheConfig = useGetCacheConfig()
  const getVerificationKey = useGetVerificationKey(api)

  const application = useMemo(() => {
    const replaceDriveCompat = isDriveCompatSDKEnabled(unleashClient)
    // This is private application, public one is in PublicApplicationContent
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
      {
        cacheConfig: replaceDriveCompat ? getCacheConfig() : undefined,
        getVerificationKey: replaceDriveCompat ? getVerificationKey : undefined,
      },
    )

    const drive = getDrive()
    // Only initialize if not already initialized
    if (!drive) {
      initializeDriveSDK({
        appName: APPS.PROTONDOCS,
        appVersion: config.APP_VERSION,
        logging: loggerForSDK(application.logger),
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
