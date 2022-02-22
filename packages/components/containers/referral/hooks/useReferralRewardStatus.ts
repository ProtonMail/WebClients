import { useEffect, useReducer, Reducer } from 'react';
import { getReferralsStatus } from '@proton/shared/lib/api/core/referrals';
import { ReferralStatus } from '@proton/shared/lib/interfaces';

import { useApi } from '../../../hooks';

type Action = { type: 'success'; payload: ReferralStatus } | { type: 'error' };

export interface UseReferralStatusReducerState {
    rewards: ReferralStatus['Rewards'];
    rewardsLimit: ReferralStatus['RewardsLimit'];
    emailsAvailable: ReferralStatus['EmailsAvailable'];
    loading: boolean;
}

const useReferralRewardStatus = () => {
    const api = useApi();
    const [referralState, dispatch] = useReducer<Reducer<UseReferralStatusReducerState, Action>>(
        (prevState, action) => {
            if (action.type === 'error') {
                return { ...prevState, loading: false };
            }

            const payload = action.payload;

            return {
                loading: false,
                rewards: payload.Rewards || 0,
                rewardsLimit: payload.RewardsLimit || 0,
                emailsAvailable: payload.EmailsAvailable || 0,
            };
        },
        {
            loading: true,
            rewards: 0,
            rewardsLimit: 0,
            emailsAvailable: 0,
        }
    );

    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const apiResults = await api<{ Code: number; Status: ReferralStatus }>(getReferralsStatus());
                dispatch({ type: 'success', payload: apiResults.Status });
            } catch (error: any) {
                dispatch({ type: 'error' });
            }
        };

        void fetchReferrals();
    }, []);

    return referralState;
};

export default useReferralRewardStatus;
