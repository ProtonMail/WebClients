import { useEffect, useRef } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { fetchUsageLimits } from '@proton/lumo-api-client/core/network';

import { useLumoPlan } from '../providers/LumoPlanProvider';
import { setRemainingLimits } from '../services/usageLimitsStore';

/**
 * Loads remaining usage limits on app init so limit-aware UI works before the first chat request.
 * SSE usage chunks and 429 handling keep the store up to date after that.
 */
export const usePrefetchUsageLimits = () => {
    const api = useApi();
    const { hasLumoPlus, isLumoPlanLoading } = useLumoPlan();
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (hasLumoPlus || isLumoPlanLoading || hasFetchedRef.current) {
            return;
        }

        hasFetchedRef.current = true;

        void fetchUsageLimits(api)
            .then(setRemainingLimits)
            .catch(() => {
                // Fail open — SSE usage and 429 rejection will populate limits later.
            });
    }, [api, hasLumoPlus, isLumoPlanLoading]);
};
