import { useCallback, useMemo, useState } from 'react';

import type { WhatsNewFeature } from '../components/WhatsNew/types';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoSelector } from '../redux/hooks';
import type { FeatureFlag } from '../redux/slices/featureFlags';
import { getSeenFeatureFlags, hasSeenFeatureFlag, markFeatureFlagAsSeen } from '../util/whatsNewStorage';
import { useFeatureFlags } from './useFeatureFlags';

const mergeFeatureFlags = (primary: FeatureFlag[], secondary: FeatureFlag[]): FeatureFlag[] => {
    const merged = [...primary];
    for (const flag of secondary) {
        if (!merged.some((existing) => existing.id === flag.id && existing.versionId === flag.versionId)) {
            merged.push(flag);
        }
    }
    return merged;
};

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
    const { dismissFlag, featureFlags } = useFeatureFlags();
    const settingsFeatureFlags = useLumoSelector((state) => state.lumoUserSettings.featureFlags);
    const isGuest = useIsGuest();
    const [dismissalVersion, setDismissalVersion] = useState(0);

    const effectiveFeatureFlags = useMemo(
        () => (isGuest ? featureFlags : mergeFeatureFlags(featureFlags, settingsFeatureFlags)),
        [featureFlags, isGuest, settingsFeatureFlags]
    );

    const dismissFeature = useCallback(
        (featureId: string, versionFlag: string) => {
            if (isGuest) {
                markFeatureFlagAsSeen(featureId, versionFlag, false);
            } else {
                dismissFlag(featureId, versionFlag, false);
            }
            setDismissalVersion((version) => version + 1);
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
            setDismissalVersion((version) => version + 1);
        },
        [dismissFlag, isGuest]
    );

    const isFeatureDismissed = useCallback(
        (featureId: string, versionFlag: string) => {
            if (isGuest) {
                return hasSeenFeatureFlag(featureId, versionFlag);
            }

            return effectiveFeatureFlags.some((flag) => flag.id === featureId && flag.versionId === versionFlag);
        },
        [effectiveFeatureFlags, isGuest]
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
                const dismissalTimes = effectiveFeatureFlags
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
    }, [
        features,
        isFeatureEnabled,
        isFeatureDismissed,
        dismissFeature,
        isGuest,
        effectiveFeatureFlags,
        declineFeature,
        dismissalVersion,
    ]);
};
