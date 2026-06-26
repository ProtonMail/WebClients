import { useLayoutEffect } from 'react';

import { usePrefetchUsageLimits } from '../hooks/usePrefetchUsageLimits';
import { useTierErrors } from '../hooks/useTierErrors';
import { useLumoDispatch } from '../redux/hooks';
import { clearTierErrors } from '../redux/slices/meta/errors';
import { areAllModelLimitsExhausted, useRemainingLimits } from '../services/usageLimitsStore';
import { handleTierError } from '../services/errors/errorHandling';
import { useLumoPlan } from './LumoPlanProvider';

/**
 * Prefetches usage limits on load and keeps tier-limit upsell state in sync with backend-reported limits.
 * Shows the weekly limit upsell only when every model pool is exhausted.
 */
export const UsageLimitsTierSync = () => {
    usePrefetchUsageLimits();
    const remainingLimits = useRemainingLimits();
    const { hasLumoPlus, lumoUserType } = useLumoPlan();
    const { hasTierErrors } = useTierErrors();
    const dispatch = useLumoDispatch();

    const allModelLimitsExhausted = areAllModelLimitsExhausted(remainingLimits);

    useLayoutEffect(() => {
        if (hasLumoPlus) {
            return;
        }

        if (remainingLimits === null) {
            if (hasTierErrors) {
                dispatch(clearTierErrors());
            }
            return;
        }

        if (allModelLimitsExhausted) {
            if (!hasTierErrors) {
                dispatch(handleTierError(lumoUserType));
            }
            return;
        }

        if (hasTierErrors) {
            dispatch(clearTierErrors());
        }
    }, [hasLumoPlus, remainingLimits, allModelLimitsExhausted, hasTierErrors, dispatch, lumoUserType]);

    return null;
};
