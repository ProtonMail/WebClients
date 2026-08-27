import { useLayoutEffect } from 'react';

import { useLumoFlags } from '../hooks/useLumoFlags';
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
    const { apertusModelAvailable } = useLumoFlags();

    useLayoutEffect(() => {
        const isSelectedModelAvailable = modelTier !== 'apertus-15' || apertusModelAvailable;

        if (hasLumoPlus && isSelectedModelAvailable) {
            return;
        }

        const availableTier = resolveAvailableModelTier(modelTier, remainingLimits, {
            isMaxAvailable: isMaxAvailableByFlag,
            isApertusEnabled: apertusModelAvailable,
        });

        if (availableTier !== getSelectedModelTier(modelTier)) {
            setModelTierWithoutPersist(availableTier);
        }
    }, [
        apertusModelAvailable,
        hasLumoPlus,
        isMaxAvailableByFlag,
        modelTier,
        remainingLimits,
        setModelTierWithoutPersist,
    ]);

    return null;
};
