import { useFlag } from '@proton/unleash'

export const useSuggestionsFeatureFlag = () => {
  const featureFlagOn = useFlag('DriveDocsSuggestionModeEnabled')
  const killSwitchOn = useFlag('DocsSuggestionsDisabled')

  return {
    isSuggestionsEnabled: featureFlagOn && !killSwitchOn,
  }
}
