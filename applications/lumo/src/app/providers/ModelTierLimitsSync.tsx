import { useLayoutEffect } from 'react';

import { getSelectedModelTier, useModelTier } from '../providers/ModelTierProvider';
import { useMaxModelAvailability } from '../hooks/useMaxModelAvailability';
import { useLumoPlan } from '../providers/LumoPlanProvider';
import { resolveAvailableModelTier, useRemainingLimits } from '../services/usageLimitsStore';

/**
 * Keeps the selected model tier on a pool that still has quota when limits are known.
 */
export const ModelTierLimitsSync = () => {
    const { modelTier, setModelTier } = useModelTier();
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
            setModelTier(availableTier);
        }
    }, [hasLumoPlus, isMaxAvailableByFlag, modelTier, remainingLimits, setModelTier]);

    return null;
};
