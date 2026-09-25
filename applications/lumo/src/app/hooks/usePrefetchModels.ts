import { useEffect, useRef } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { fetchModels } from '@proton/lumo-api-client/core/network';

import { setModels } from '../services/modelsStore';

/**
 * Loads model metadata (including context window sizes) on app init for compaction and UI limits.
 */
export const usePrefetchModels = () => {
    const api = useApi();
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (hasFetchedRef.current) {
            return;
        }

        hasFetchedRef.current = true;

        void fetchModels(api)
            .then(setModels)
            .catch(() => {
                // Fail open — compaction and indicators fall back to DEFAULT_CONTEXT_LIMITS.
            });
    }, [api]);
};
