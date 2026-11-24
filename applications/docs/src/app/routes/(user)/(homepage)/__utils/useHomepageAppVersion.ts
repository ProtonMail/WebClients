import { useMemo } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { getAppVersion } from '@proton/components/helpers/appVersion'
import useEarlyAccess from '@proton/components/hooks/useEarlyAccess'

import type { HomepageAppVersion } from '~/homepage'

// The marks of Proton's `AppVersion` (packages/components/components/version/AppVersion.tsx).
const EARLY_ACCESS_MARKS: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  relaunch: 'δ',
}

/** The version that Proton's `AppVersion` showed beside the storage, as the homepage's sidebar now shows it. */
export function useHomepageAppVersion(): HomepageAppVersion {
  const { APP_VERSION } = useConfig()
  const { currentEnvironment } = useEarlyAccess()

  return useMemo(() => {
    const fullVersion = getAppVersion(APP_VERSION)
    return {
      version: fullVersion.split('+')[0],
      fullVersion,
      earlyAccessMark: currentEnvironment ? EARLY_ACCESS_MARKS[currentEnvironment] : undefined,
    }
  }, [APP_VERSION, currentEnvironment])
}
