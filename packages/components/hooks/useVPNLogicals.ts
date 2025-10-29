import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { queryVPNLogicalServerInfo, queryVPNLogicalServerLookup } from '@proton/shared/lib/api/vpn';
import type { Logical } from '@proton/shared/lib/vpn/Logical';

import useApi from './useApi';
import useCache from './useCache';

const useVPNLogicals = () => {
    const api = useApi();
    const mountedRef = useRef(true);
    const cache = useCache();

    const [state, setState] = useState<{
        error?: Error;
        result?: {
            LogicalServers: Logical[];
        };
        loading: boolean;
        search: (name: string) => Promise<Logical>;
    }>(() => ({
        result: cache.get('vpn-logicals')?.result,
        loading: false,
        search: async (name: string): Promise<Logical> => {
            const cachedValue = cache.get('vpn-logicals');
            const logicalServers = cachedValue?.result?.LogicalServers || [];

            const upperName = name.toUpperCase();
            const cachedServer = logicalServers.find((server: Logical) => server.Name.toUpperCase() === upperName);
            if (cachedServer) {
                return cachedServer;
            }

            const result = await api<{ LogicalServer: Logical }>(queryVPNLogicalServerLookup(name));
            const logical = result.LogicalServer;

            const updatedLogicalServers = [...logicalServers, logical];
            const updatedResult = { LogicalServers: updatedLogicalServers };

            cache.set('vpn-logicals', {
                result: updatedResult,
                time: cachedValue?.time || Date.now(),
            });

            if (mountedRef.current) {
                setState((prev) => ({ ...prev, result: updatedResult, loading: false }));
            }

            return logical;
        },
    }));

    const setResult = (result: { LogicalServers: Logical[] }) =>
        setState((prev) => ({ ...prev, result, loading: false }));
    const setError = (e: any) => setState((prev) => ({ ...prev, error: e as Error, loading: false }));

    const fetch = useCallback(async (maxAge = 0) => {
        try {
            const cachedValue = cache.get('vpn-logicals');
            const time = new Date().getTime();

            if (cachedValue?.time + maxAge >= time) {
                setResult(cachedValue?.result);

                return;
            }

            if (cachedValue?.promise) {
                setResult(await cachedValue?.promise);

                return;
            }

            const promise = api(queryVPNLogicalServerInfo()) as Promise<{ LogicalServers: Logical[] }>;
            cache.set('vpn-logicals', { promise });
            const result = await promise;
            cache.set('vpn-logicals', {
                result,
                time,
            });

            if (mountedRef.current) {
                setResult(result);
            }
        } catch (e) {
            cache.delete('vpn-logicals');

            if (mountedRef.current) {
                setError(e);
            }
        }
    }, []);

    useEffect(() => {
        if (!cache.has('vpn-logicals')) {
            void fetch();
        }

        return () => {
            mountedRef.current = false;
        };
    }, []);

    return useMemo(
        () => ({
            ...state,
            fetch,
        }),
        [state]
    );
};

export default useVPNLogicals;
