import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { FeatureContextValue } from '@proton/features/useFeatures';

import { getCompletedOnboardingFlag, isOnboardingComplete } from './categoriesOnboarding';

export const useMarkOnboardingComplete = () => {
    const b2cFlag = useFeature<number>(FeatureCode.CategoryViewB2COnboardingViewFlags);
    const b2bFlag = useFeature<number>(FeatureCode.CategoryViewB2BOnboardingViewFlags);

    return () => {
        const markComplete = (flag: FeatureContextValue<number>) => {
            if (flag.feature?.Value === undefined || isOnboardingComplete(flag.feature.Value)) {
                return;
            }

            void flag.update(getCompletedOnboardingFlag(flag.feature.Value));
        };

        markComplete(b2cFlag);
        markComplete(b2bFlag);
    };
};
