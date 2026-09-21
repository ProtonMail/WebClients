import { useCallback, useMemo, useRef, useState } from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { ARTIFACT_CREATE_SPOTLIGHT_ID, ARTIFACT_NEW_LABEL_END_DATE } from '../constants/artifactOnboarding';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoSelector } from '../redux/hooks';
import type { FeatureFlag } from '../redux/slices/featureFlags';
import {
    hasSeenArtifactCreateSpotlightLocally,
    markArtifactCreateSpotlightSeenLocally,
} from '../util/artifactCreateSpotlightStorage';
import { useFeatureFlags } from './useFeatureFlags';
import { useIsLumoSmallScreen } from './useIsLumoSmallScreen';
import { useLumoFlags } from './useLumoFlags';

const mergeFeatureFlags = (primary: FeatureFlag[], secondary: FeatureFlag[]): FeatureFlag[] => {
    const merged = [...primary];
    for (const flag of secondary) {
        if (!merged.some((existing) => existing.id === flag.id && existing.versionId === flag.versionId)) {
            merged.push(flag);
        }
    }
    return merged;
};

const hasAuthSpotlightSeen = (flags: FeatureFlag[]): boolean => {
    return flags.some((flag) => flag.id === ARTIFACT_CREATE_SPOTLIGHT_ID);
};

export const useArtifactCreateSpotlight = (canDisplay: boolean) => {
    const { artifactsView, artifactsViewSpotlight } = useLumoFlags();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const isGuest = useIsGuest();
    const { featureFlags, dismissFlag } = useFeatureFlags();
    const settingsFeatureFlags = useLumoSelector((state) => state.lumoUserSettings.featureFlags);
    const lumoUserSettingsBootstrapped = useLumoSelector((state) => state.initialization.lumoUserSettingsBootstrapped);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [seenVersion, setSeenVersion] = useState(0);

    const isSpotlightReady = isGuest || lumoUserSettingsBootstrapped;

    const hasSeenSpotlight = useMemo(() => {
        if (isGuest) {
            return hasSeenArtifactCreateSpotlightLocally();
        }

        const merged = mergeFeatureFlags(featureFlags, settingsFeatureFlags);
        return hasAuthSpotlightSeen(merged);
    }, [featureFlags, isGuest, settingsFeatureFlags, seenVersion]);

    const isExpired = Date.now() >= ARTIFACT_NEW_LABEL_END_DATE;

    const shouldShowSpotlight =
        canDisplay &&
        isSpotlightReady &&
        artifactsView &&
        artifactsViewSpotlight &&
        !hasSeenSpotlight &&
        !isExpired &&
        !isSmallScreen &&
        !isMobile();

    const markSpotlightSeen = useCallback(() => {
        if (hasSeenSpotlight) {
            return;
        }

        if (isGuest) {
            markArtifactCreateSpotlightSeenLocally();
        } else {
            dismissFlag(ARTIFACT_CREATE_SPOTLIGHT_ID, 'release', false);
        }
        setSeenVersion((version) => version + 1);
    }, [dismissFlag, hasSeenSpotlight, isGuest]);

    const showNewLabel = artifactsView && artifactsViewSpotlight && !isExpired;

    return {
        anchorRef,
        markSpotlightSeen,
        shouldShowSpotlight,
        showNewLabel,
    };
};
