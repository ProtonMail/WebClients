import { useCallback } from 'react';

import { useMaxModelAvailability } from './useMaxModelAvailability';
import { useOptionalModelTier } from '../providers/ModelTierProvider';
import { useLumoPlan } from '../providers/LumoPlanProvider';
import { useLumoDispatch } from '../redux/hooks';
import { clearTierErrors } from '../redux/slices/meta/errors';
import {
    areAllModelLimitsExhausted,
    isModelTierSelectable,
    resolveUsageModelTier,
    useRemainingLimits,
} from '../services/usageLimitsStore';
import { handleTierError } from '../services/errors/errorHandling';
import { useTierErrors } from './useTierErrors';

/**
 * Per-model usage gate driven by SSE `remaining_limits`.
 * Blocks sends when the selected model has no allocation left; upsell only when all models are exhausted.
 */
export const useChatLimitGate = () => {
    const { hasLumoPlus, lumoUserType } = useLumoPlan();
    const remainingLimits = useRemainingLimits();
    const modelTierContext = useOptionalModelTier();
    const selectedModelTier = resolveUsageModelTier(modelTierContext?.modelTier);
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const { hasTierErrors } = useTierErrors();
    const dispatch = useLumoDispatch();

    const selectedModelLimitExhausted =
        selectedModelTier !== undefined &&
        !isModelTierSelectable(selectedModelTier, remainingLimits, { isMaxAvailable: isMaxAvailableByFlag });
    const allModelLimitsExhausted = areAllModelLimitsExhausted(remainingLimits);
    const isBlocked = !hasLumoPlus && selectedModelLimitExhausted;

    const ensureTierError = useCallback(() => {
        if (!hasLumoPlus && allModelLimitsExhausted && !hasTierErrors) {
            dispatch(handleTierError(lumoUserType));
        }
    }, [hasLumoPlus, allModelLimitsExhausted, hasTierErrors, dispatch, lumoUserType]);

    const clearTierErrorIfModelAvailable = useCallback(() => {
        if (!allModelLimitsExhausted && hasTierErrors) {
            dispatch(clearTierErrors());
        }
    }, [allModelLimitsExhausted, hasTierErrors, dispatch]);

    return {
        isBlocked,
        selectedModelLimitExhausted,
        allModelLimitsExhausted,
        ensureTierError,
        clearTierErrorIfModelAvailable,
        /** @deprecated Prefer selectedModelLimitExhausted or allModelLimitsExhausted. */
        chatLimitExhausted: selectedModelLimitExhausted,
    };
};
