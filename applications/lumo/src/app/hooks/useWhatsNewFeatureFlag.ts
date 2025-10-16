import { useCallback, useMemo, useState } from 'react';

import { hasSeenFeatureFlag, markFeatureFlagAsSeen } from '../utils/whatsNewStorage';

interface UseWhatsNewFeatureFlagReturn {
    shouldShow: boolean;
    markAsSeen: () => void;
}

export const useWhatsNewFeatureFlag = (
    featureFlagName: string,
    isOnboardingCompleted: boolean
): UseWhatsNewFeatureFlagReturn => {
    const [isDismissed, setIsDismissed] = useState(false);

    const shouldShow = useMemo(() => {
        if (!isOnboardingCompleted || isDismissed) {
            return false;
        }
        return !hasSeenFeatureFlag(featureFlagName);
    }, [featureFlagName, isOnboardingCompleted, isDismissed]);

    const markAsSeen = useCallback(() => {
        markFeatureFlagAsSeen(featureFlagName);
        setIsDismissed(true);
    }, [featureFlagName]);

    return { shouldShow, markAsSeen };
};
