import {useCallback, useMemo} from 'react';

import {useIsGuest} from '../providers/IsGuestProvider';
import type {WhatsNewFeature} from '../components/WhatsNew/types';
import {getSeenFeatureFlags, hasSeenFeatureFlag, markFeatureFlagAsSeen} from '../util/whatsNewStorage';
import {useFeatureFlags} from './useFeatureFlags';

interface UseStaggeredWhatsNewFeaturesReturn {
    currentFeature: WhatsNewFeature | null;
    // Dismiss feature (user clicked "Try")
    dismissFeature: (featureId: string, versionFlag: string) => void;
    // Decline feature (user clicked "Maybe later" or closes modal)
    declineFeature: (featureId: string, versionFlag: string) => void;
    isFeatureDismissed: (featureId: string, versionFlag: string) => boolean;
}

// Show the first available feature after a 24 hour delay from the last dismissal

export const useStaggeredWhatsNewFeatures = (
    features: WhatsNewFeature[],
    isFeatureEnabled: boolean
): UseStaggeredWhatsNewFeaturesReturn => {
    const { isDismissed, dismissFlag, featureFlags } = useFeatureFlags();
    const isGuest = useIsGuest();

    const dismissFeature = useCallback(
        (featureId: string, versionFlag: string) => {
            if (isGuest) {
                markFeatureFlagAsSeen(featureId, versionFlag, false);
            } else {
                dismissFlag(featureId, versionFlag, false);
            }
        },
        [dismissFlag, isGuest]
    );

    const declineFeature = useCallback(
        (featureId: string, versionFlag: string) => {
            if (isGuest) {
                markFeatureFlagAsSeen(featureId, versionFlag, true);
            } else {
                dismissFlag(featureId, versionFlag, true);
            }
        },
        [dismissFlag, isGuest]
    );

    const isFeatureDismissed = useCallback(
        (featureId: string, versionFlag: string) => {
            if (isGuest) {
                return hasSeenFeatureFlag(featureId, versionFlag);
            } else {
                return isDismissed(featureId, versionFlag);
            }
        },
        [isDismissed, isGuest]
    );

    return useMemo(() => {
        if (!isFeatureEnabled) {
            return {
                currentFeature: null,
                dismissFeature,
                declineFeature,
                isFeatureDismissed,
            };
        }

        // Get all features that can potentially be shown
        const featuresToShow = features.filter((feature) => feature.canShow);

        if (featuresToShow.length === 0) {
            return {
                currentFeature: null,
                dismissFeature,
                declineFeature,
                isFeatureDismissed,
            };
        }

        // Get the most recent dismissal timestamp
        const getLastDismissalTime = (): number => {
            if (isGuest) {
                const seenFlags = getSeenFeatureFlags();
                const dismissalTimes = seenFlags
                    .map((flag: { dismissedAt: number }) => flag.dismissedAt)
                    .filter(Boolean);
                return dismissalTimes.length > 0 ? Math.max(...dismissalTimes) : 0;
            } else {
                const dismissalTimes = featureFlags
                    .map((flag: { dismissedAt: number }) => flag.dismissedAt)
                    .filter(Boolean);
                return dismissalTimes.length > 0 ? Math.max(...dismissalTimes) : 0;
            }
        };

        const lastDismissalTime = getLastDismissalTime();
        const timeSinceLastDismissal = Date.now() - lastDismissalTime;
        const delayMs = 60 * 1000 * 60 * 24; // 24 hours delay
        // const delayMs = 60 * 1000; // 1 minute delay for testing

        // If not enough time has passed since the last dismissal, don't show any feature
        if (timeSinceLastDismissal < delayMs) {
            return {
                currentFeature: null,
                dismissFeature,
                declineFeature,
                isFeatureDismissed,
            };
        }

        // Filter out already dismissed features and return the first available one
        const currentFeature =
            featuresToShow.find((feature) => !isFeatureDismissed(feature.id, feature.versionFlag)) || null;

        return {
            currentFeature,
            dismissFeature,
            declineFeature,
            isFeatureDismissed,
        };
    }, [features, isFeatureEnabled, isFeatureDismissed, dismissFlag, isGuest, featureFlags, declineFeature]);
};
