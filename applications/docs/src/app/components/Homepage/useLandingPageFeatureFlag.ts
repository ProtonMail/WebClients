import { useFlag } from '@proton/unleash'

export const useLandingPageFeatureFlag = () => {
  const rollout = useFlag('DriveDocsLandingPageEnabled')
  return rollout
}
