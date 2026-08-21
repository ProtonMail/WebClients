import { useFlag } from '@proton/unleash/useFlag';

export const useLiveCaptionsFeatureEnabled = (): boolean => useFlag('MeetLiveCaptions');
