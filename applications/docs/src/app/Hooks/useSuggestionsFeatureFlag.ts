import { useFlag } from '@proton/unleash'

export const useSuggestionsFeatureFlag = () => {
  const killSwitchOn = useFlag('DocsSuggestionsDisabled')

  return {
    isSuggestionsEnabled: !killSwitchOn,
  }
}
