import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import { useOneTimeCodeDetectionPreference } from './useOneTimeCodeSettings';

export const useOneTimeCodeDetection = (): boolean => {
    const isFlagOn = useFlag(MailFeatureFlag.OneTimePasscode);
    const [detectionEnabled] = useOneTimeCodeDetectionPreference();

    return isFlagOn && detectionEnabled;
};
