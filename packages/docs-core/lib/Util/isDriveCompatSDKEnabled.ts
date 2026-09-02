import type { UnleashClient } from '@proton/unleash/UnleashClient'
import type { FeatureFlag } from '@proton/unleash/Flags'

export function isDriveCompatSDKEnabled(unleashClient: UnleashClient): boolean {
  if (!unleashClient.isReady()) {
    console.warn('Attempting to read DocsDriveCompatSDK flag before unleash is ready')
    return false
  }

  const docsFlag: FeatureFlag = 'DocsDriveCompatSDK'

  return unleashClient.isEnabled(docsFlag)
}
