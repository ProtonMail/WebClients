import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { ARTIFACT_PANEL_SPOTLIGHT_ID } from '../constants/artifactOnboarding';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoSelector } from '../redux/hooks';
import {
    hasSeenArtifactPanelSpotlightLocally,
    markArtifactPanelSpotlightSeenLocally,
} from '../util/artifactPanelSpotlightStorage';
import { useFeatureFlags } from './useFeatureFlags';
import { useLumoFlags } from './useLumoFlags';

/**
 * One-time spotlight over the artifact panel, explaining that artifacts are now created by default
 * and how to turn them off. Once it has been displayed, it counts as seen as soon as it is hidden
 * for any reason (closed, panel closed, generation or manual edit started) — it never comes back.
 */
export const useArtifactPanelSpotlight = (canDisplay: boolean) => {
    const { artifactsView, artifactsViewSpotlight } = useLumoFlags();
    const isGuest = useIsGuest();
    const { featureFlags, dismissFlag } = useFeatureFlags();
    const settingsFeatureFlags = useLumoSelector((state) => {
        return state.lumoUserSettings.featureFlags;
    });
    const lumoUserSettingsBootstrapped = useLumoSelector((state) => {
        return state.initialization.lumoUserSettingsBootstrapped;
    });
    const [markedSeen, setMarkedSeen] = useState(false);
    const wasDisplayedRef = useRef(false);

    const isSpotlightReady = isGuest || lumoUserSettingsBootstrapped;

    const hasSeenSpotlight = useMemo(() => {
        if (markedSeen) {
            return true;
        }

        if (isGuest) {
            return hasSeenArtifactPanelSpotlightLocally();
        }

        return [...featureFlags, ...settingsFeatureFlags].some((flag) => {
            return flag.id === ARTIFACT_PANEL_SPOTLIGHT_ID;
        });
    }, [featureFlags, isGuest, markedSeen, settingsFeatureFlags]);

    const shouldShowSpotlight =
        canDisplay && isSpotlightReady && artifactsView && artifactsViewSpotlight && !hasSeenSpotlight && !isMobile();

    const markSpotlightSeen = useCallback(() => {
        wasDisplayedRef.current = false;
        if (hasSeenSpotlight) {
            return;
        }

        if (isGuest) {
            markArtifactPanelSpotlightSeenLocally();
        } else {
            dismissFlag(ARTIFACT_PANEL_SPOTLIGHT_ID, 'release', false);
        }
        setMarkedSeen(true);
    }, [dismissFlag, hasSeenSpotlight, isGuest]);

    const handleSpotlightDisplayed = useCallback(() => {
        wasDisplayedRef.current = true;
    }, []);

    useEffect(() => {
        if (!shouldShowSpotlight && wasDisplayedRef.current) {
            markSpotlightSeen();
        }
    }, [shouldShowSpotlight, markSpotlightSeen]);

    // The docked panel unmounts when it is closed or switched to full screen.
    const markSpotlightSeenRef = useRef(markSpotlightSeen);
    markSpotlightSeenRef.current = markSpotlightSeen;
    useEffect(() => {
        return () => {
            if (wasDisplayedRef.current) {
                markSpotlightSeenRef.current();
            }
        };
    }, []);

    return {
        shouldShowSpotlight,
        markSpotlightSeen,
        handleSpotlightDisplayed,
    };
};
