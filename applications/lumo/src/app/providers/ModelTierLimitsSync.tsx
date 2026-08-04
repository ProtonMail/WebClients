import { useLayoutEffect } from 'react';

import { useMaxModelAvailability } from '../hooks/useMaxModelAvailability';
import { useLumoPlan } from '../providers/LumoPlanProvider';
import { resolveAvailableModelTier, useRemainingLimits } from '../services/usageLimitsStore';
import { getSelectedModelTier } from './modelTierConstants';
import { useModelTier } from './modelTierContext';

/**
 * Keeps the selected model tier on a pool that still has quota when limits are known.
 */
export const ModelTierLimitsSync = () => {
    const { modelTier, setModelTierWithoutPersist } = useModelTier();
    const remainingLimits = useRemainingLimits();
    const { hasLumoPlus } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();

    useLayoutEffect(() => {
        if (hasLumoPlus) {
            return;
        }

        const availableTier = resolveAvailableModelTier(modelTier, remainingLimits, {
            isMaxAvailable: isMaxAvailableByFlag,
        });

        if (availableTier !== getSelectedModelTier(modelTier)) {
            setModelTierWithoutPersist(availableTier);
        }
    }, [hasLumoPlus, isMaxAvailableByFlag, modelTier, remainingLimits, setModelTierWithoutPersist]);

    return null;
};
