import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getClientVPNInfo } from 'proton-shared/lib/api/vpn';
import useApi from './useApi';
import useCache from './useCache';

const useUserVPN = () => {
    const api = useApi();
    const mountedRef = useRef(true);
    const cache = useCache();
    const [state, setState] = useState(() => ({ result: cache.get('vpn'), loading: false }));

    const fetch = useCallback(async () => {
        try {
            const result = await api(getClientVPNInfo());
            cache.set('vpn', result);
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
