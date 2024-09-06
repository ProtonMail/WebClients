import { useFlag } from '@proton/unleash'

export const useSuggestionsFeatureFlag = () => {
  const isSuggestionsEnabled = useFlag('DriveDocsSuggestionModeEnabled')

  return {
    isSuggestionsEnabled,
  }
}
