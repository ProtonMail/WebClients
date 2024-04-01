import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export const useOfflineSupported = () => {
    const offlineModeEnabled = useFeatureFlag(PassFeature.PassWebOfflineMode);

    if (BUILD_TARGET === 'web') return offlineModeEnabled;
    else if (['chrome', 'firefox'].includes(BUILD_TARGET)) return false;
    else return true;
};
