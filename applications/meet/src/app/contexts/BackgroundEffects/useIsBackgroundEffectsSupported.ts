import { isMobile } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { supportsBackgroundEffects } from '../../processors/background-processor/createBackgroundProcessor';

export const useIsBackgroundEffectsSupported = () => {
    const isEnabledOnMobileBrowsers = useFlag('MeetBackgroundEffectsOnMobileBrowsers');

    if (isMobile() && !isEnabledOnMobileBrowsers) {
        return false;
    }

    return supportsBackgroundEffects();
};
