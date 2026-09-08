import { useLayoutEffect } from 'react';

import { usePrefetchUsageLimits } from '../hooks/usePrefetchUsageLimits';
import { useTierErrors } from '../hooks/useTierErrors';
import { useLumoDispatch } from '../redux/hooks';
import { clearTierErrors } from '../redux/slices/meta/errors';
import { useExhaustedLimitNotice, useRemainingLimits } from '../services/usageLimitsStore';
import { handleTierError } from '../services/errors/errorHandling';
import { useLumoPlan } from './LumoPlanProvider';

/**
 * Prefetches usage limits on load and keeps tier-limit upsell state in sync with backend-reported limits.
 * Shows the upgrade upsell when a completion or blocked send exhausts a chat-model pool.
 */
export const UsageLimitsTierSync = () => {
    usePrefetchUsageLimits();
    const remainingLimits = useRemainingLimits();
    const { hasLumoPlus, lumoUserType } = useLumoPlan();
    const { hasTierErrors } = useTierErrors();
    const dispatch = useLumoDispatch();

    const exhaustedLimitNotice = useExhaustedLimitNotice();

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

        if (exhaustedLimitNotice) {
            if (!hasTierErrors) {
                dispatch(handleTierError(lumoUserType));
            }
            return;
        }

        if (hasTierErrors) {
            dispatch(clearTierErrors());
        }
    }, [hasLumoPlus, remainingLimits, exhaustedLimitNotice, hasTierErrors, dispatch, lumoUserType]);

    return null;
};
