import { useLayoutEffect } from 'react';

import { useLumoFlags } from '../hooks/useLumoFlags';
import { useLumoUserSettings } from '../hooks/useLumoUserSettings';
import { useMaxModelAvailability } from '../hooks/useMaxModelAvailability';
import { resolveAvailableModelTier, useRemainingLimits } from '../services/usageLimitsStore';
import { useIsGuest } from './IsGuestProvider';
import { useModelTier } from './modelTierContext';

/**
 * Applies persisted model/response preferences from lumoUserSettings for signed-in users.
 * Runtime selection may still fall back when the preferred tier has no quota.
 */
export const ModelTierPreferencesSync = () => {
    const isGuest = useIsGuest();
    const { lumoUserSettings } = useLumoUserSettings();
    const { setModelTierWithoutPersist, setResponseModeWithoutPersist } = useModelTier();
    const remainingLimits = useRemainingLimits();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const { apertusModelAvailable } = useLumoFlags();

    useLayoutEffect(() => {
        if (isGuest) {
            return;
        }

        const { preferredModelTier, preferredResponseMode } = lumoUserSettings;

        if (preferredResponseMode) {
            setResponseModeWithoutPersist(preferredResponseMode);
        }

        if (preferredModelTier) {
            const availableTier = resolveAvailableModelTier(preferredModelTier, remainingLimits, {
                isMaxAvailable: isMaxAvailableByFlag,
                isApertusEnabled: apertusModelAvailable,
            });
            setModelTierWithoutPersist(availableTier);
        }
    }, [
        isGuest,
        apertusModelAvailable,
        isMaxAvailableByFlag,
        lumoUserSettings.preferredModelTier,
        lumoUserSettings.preferredResponseMode,
        remainingLimits,
        setModelTierWithoutPersist,
        setResponseModeWithoutPersist,
    ]);

    return null;
};
