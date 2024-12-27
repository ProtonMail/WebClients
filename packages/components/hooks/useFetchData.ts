import { useEffect, useRef, useState } from 'react';

import { SECOND } from '@proton/shared/lib/constants';

interface UseFetchDataOptions<Data> {
    /**
     * A function that knows how to fetch the data (e.g. calls the
     * proper API or does anything else needed).
     */
    fetcher: () => Promise<Data>;

    /**
     * The maximum age (in ms) for which the data is considered “fresh.”
     */
    maxAge: number;
}

/**
 * A generic reusable hook that:
 * 1. Fetches data initially.
 * 2. Stores it in state.
 * 3. Periodically refreshes the data, based on `maxAge`.
 */
export const useFetchData = <Data>({ fetcher, maxAge }: UseFetchDataOptions<Data>) => {
    const [result, setResult] = useState<Data | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // We track the last time we “attempted” to update, and the last time we “successfully” updated.
    const refreshStateRef = useRef({ lastUpdate: 0, lastSuccess: 0 });

    const refresh = async () => {
        try {
            refreshStateRef.current.lastUpdate = Date.now();
            const data = await fetcher();
            refreshStateRef.current.lastSuccess = Date.now();
            setResult(data);
        } catch (error) {
            // For now, ignore or handle as needed
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        refresh();

        // Periodic refresh
        const refreshHandle = setInterval(() => {
            const { lastSuccess, lastUpdate } = refreshStateRef.current;
            // If we haven't loaded successfully once yet, don't try to refresh
            if (!lastSuccess) {
                return;
            }

            const now = Date.now();
            // Refresh if:
            //  - It's been at least (maxAge / 5) since our last attempt, AND
            //  - It's been at least maxAge since our last successful load
            if (now > lastUpdate + maxAge / 5 && now > lastSuccess + maxAge) {
                refresh();
            }
        }, 30 * SECOND); // e.g. check every 30 seconds

        return () => {
            clearInterval(refreshHandle);
        };
    }, [maxAge]);

    return {
        loading: !result || loading,
        result,
        refresh,
    };
};
