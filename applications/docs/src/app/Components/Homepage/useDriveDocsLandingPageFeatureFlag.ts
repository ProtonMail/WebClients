import { useFlag } from '@proton/unleash'

export const useDriveDocsLandingPageFeatureFlag = () => {
  const rollout = useFlag('DriveDocsLandingPageEnabled')
  return rollout
}
