import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { queryVPNLogicalServerInfo } from '@proton/shared/lib/api/vpn';
import { Logical } from '../containers/vpn/Logical';
import useApi from './useApi';
import useCache from './useCache';

const useVPNLogicals = () => {
    const api = useApi();
    const mountedRef = useRef(true);
    const cache = useCache();
    const [state, setState] = useState<{
        error?: Error,
        result?: {
            LogicalServers: Logical[],
        },
        loading: boolean,
    }>(() => ({ result: cache.get('vpn-logicals')?.result, loading: false }));

    const fetch = useCallback(async (maxAge = 0) => {
        try {
            const cachedValue = cache.get('vpn-logicals');
            const time = new Date().getTime();

            if (cachedValue?.time + maxAge >= time) {
                setState({ result: cachedValue?.result, loading: false });

                return;
            }

            if (cachedValue?.promise) {
                const result = await cachedValue?.promise;
                setState({ result: result, loading: false });

                return;
            }

            const promise = api(queryVPNLogicalServerInfo());
            cache.set('vpn-logicals', { promise });
            const result = await promise;
            cache.set('vpn-logicals', {
                result,
                time,
            });

            if (mountedRef.current) {
                setState({ result, loading: false });
            }
        } catch (e) {
            cache.delete('vpn');

            if (mountedRef.current) {
                setState({ error: e as Error, loading: false });
            }
        }
    }, []);

    useEffect(() => {
        if (!cache.has('vpn-logicals')) {
            fetch();
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
