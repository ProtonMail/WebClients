import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type Currency } from '@proton/payments';
import { getClientVPNInfo } from '@proton/shared/lib/api/vpn';

import useApi from './useApi';
import useCache from './useCache';

export interface VPNUserInfo {
    VPN: {
        ExpirationTime: number;
        Name: string;
        Password: string;
        GroupID: string;
        Status: number;
        PlanName: string | null;
        PlanTitle: string | null;
        MaxTier: number | null;
        MaxConnect: number;
        Groups: string[];
        NeedConnectionAllocation: boolean;
    };
    Warnings: any[];
    Services: number;
    Subscribed: number;
    Delinquent: number;
    HasPaymentMethod: number;
    Credit: number;
    Currency: Currency;
}

const useUserVPN = () => {
    const api = useApi();
    const mountedRef = useRef(true);
    const cache = useCache();
    const [state, setState] = useState<{
        error?: Error;
        result?: VPNUserInfo;
        loading: boolean;
    }>(() => ({ result: cache.get('vpn')?.result, loading: false }));

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
                setState({ result, loading: false });

                return;
            }

            const promise = api(getClientVPNInfo()) as Promise<VPNUserInfo>;
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
            cache.delete('vpn');

            if (mountedRef.current) {
                setState({ error: e as Error, loading: false });
            }
        }
    }, []);

    useEffect(() => {
        fetch(30_000);

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
