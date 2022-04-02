import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getClientVPNInfo } from '@proton/shared/lib/api/vpn';
import useApi from './useApi';
import useCache from './useCache';

const useUserVPN = () => {
    const api = useApi();
    const mountedRef = useRef(true);
    const cache = useCache();
    const [state, setState] = useState(() => ({ result: cache.get('vpn')?.result, loading: false }));

    const fetch = useCallback(async (maxAge = 0) => {
        try {
            const cachedValue = cache.get('vpn');
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

            const promise = api(getClientVPNInfo());
            cache.set('vpn', { promise });
            const result = await promise;
            cache.set('vpn', {
                result,
                time,
            });

            if (mountedRef.current) {
                setState({ result, loading: false });
            }
        } catch (e) {
            if (mountedRef.current) {
                setState({ error: e, loading: false });
            }
        }
    }, []);

    useEffect(() => {
        if (!cache.has('vpn')) {
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

export default useUserVPN;
