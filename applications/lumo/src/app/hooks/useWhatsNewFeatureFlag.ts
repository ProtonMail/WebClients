// import { useCallback, useMemo } from 'react';

// import { useFeatureFlags } from './useFeatureFlags';

// interface UseWhatsNewFeatureFlagReturn {
//     shouldShow: boolean;
//     markAsSeen: () => void;
// }
// // TODO: delete this
// export const useWhatsNewFeatureFlag = (
//     featureFlagName: string,
//     isOnboardingCompleted: boolean
// ): UseWhatsNewFeatureFlagReturn => {
//     const { isDismissed, dismissFlag } = useFeatureFlags();

//     const shouldShow = useMemo(() => {
//         if (!isOnboardingCompleted) {
//             return false;
//         }
//         return !isDismissed(featureFlagName);
//     }, [featureFlagName, isOnboardingCompleted, isDismissed]);

//     const markAsSeen = useCallback(() => {
//         dismissFlag(featureFlagName);
//     }, [featureFlagName, dismissFlag]);

//     return { shouldShow, markAsSeen };
// };
