import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { EXTENSION_BUILD } from '@proton/pass/lib/client';
import { PassFeature } from '@proton/pass/types/api/features';

export const useOfflineSupported = () => {
    const offlineModeEnabled = useFeatureFlag(PassFeature.PassWebOfflineMode);

    if (OFFLINE_SUPPORTED) {
        if (BUILD_TARGET === 'web') return offlineModeEnabled;
        else if (EXTENSION_BUILD) return false;
        else return true;
    }

    return false;
};
