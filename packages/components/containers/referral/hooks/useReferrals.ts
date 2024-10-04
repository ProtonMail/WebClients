import type { Reducer } from 'react';
import { useEffect, useReducer } from 'react';

import useApi from '@proton/components/hooks/useApi';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { Referral } from '@proton/shared/lib/interfaces';

import fetchAllReferralsByOffset from '../helpers/fetchAllReferralsByOffset';

interface ReferralApiResult {
    Referrals?: Referral[];
    Total?: number;
}

type Action = { type: 'success'; payload: ReferralApiResult } | { type: 'error' };

export interface UseReferralsReducerState {
    referrals: Referral[];
    loading: boolean;
    total: number;
}

const getDefaultState = () => ({
    loading: true,
    referrals: [],
    total: 0,
});

const useReferrals = () => {
    const api = useApi();
    const isMounted = useIsMounted();
    const [referralState, dispatch] = useReducer<Reducer<UseReferralsReducerState, Action>>((prevState, action) => {
        if (action.type === 'error') {
            return { ...prevState, loading: false };
        }

        if (action.type === 'success') {
            const apiResult = action.payload;

            return {
                loading: false,
                referrals: apiResult.Referrals || [],
                total: apiResult.Total || 0,
            };
        }

        return getDefaultState();
    }, getDefaultState());

    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const apiResults = await fetchAllReferralsByOffset(api);
                if (isMounted()) {
                    dispatch({ type: 'success', payload: apiResults });
                }
            } catch (error: any) {
                if (isMounted()) {
                    dispatch({ type: 'error' });
                }
            }
        };

        void fetchReferrals();
    }, []);

    return referralState;
};

export default useReferrals;
