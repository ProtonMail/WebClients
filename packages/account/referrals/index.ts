import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type Currency, DEFAULT_CURRENCY } from '@proton/payments';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getReferralsStatus } from '@proton/shared/lib/api/core/referrals';
import type { Api, Referral, ReferralStatus } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import fetchAllReferralsByOffset from './helpers/fetchAllReferralsByOffset';
import { getDeduplicatedReferrals } from './helpers/getDeduplicatedReferrals';

interface Referrals {
    all: Referral[];
    status: {
        // rewardMonths: number;
        // rewardMonthsLimit: number;
        rewardAmount: number; // TODO: referral: check with sandy what currency this is returned in
        // rewardAmountLimit: number;
        // emailsAvailable: number;
        hasReachedRewardLimit: boolean;
        currency: Currency;
    };
    total: number;
    totalSubscribed: number;
    // totalEarned: number;
    // creditBalance: number;
}

export const referralsDefaultValue: Referrals = {
    all: [],
    status: {
        // rewardMonths: 0,
        // rewardMonthsLimit: 0,
        rewardAmount: 0,
        // rewardAmountLimit: 100000,
        // emailsAvailable: 0,
        hasReachedRewardLimit: false,
        currency: DEFAULT_CURRENCY,
    },
    total: 0,
    totalSubscribed: 0,
    // totalEarned: 0,
    // creditBalance: 0,
};

const name = 'referrals' as const;

export interface ReferralsState {
    [name]: ModelState<Referrals>;
}

type SliceState = ReferralsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectReferrals = (state: ReferralsState) => state[name];
const getReferrals = async (api: Api) => {
    try {
        const [referralResult, statusResult] = await Promise.all([
            fetchAllReferralsByOffset(api),
            api<{ Code: number; Status: ReferralStatus }>(getReferralsStatus()),
        ]);
        return {
            all: referralResult.Referrals,
            status: {
                // rewardMonths: statusResult.Status.RewardMonths,
                // rewardMonthsLimit: statusResult.Status.RewardMonthsLimit,
                rewardAmount: statusResult.Status.RewardAmount, // TODO: referral: expose this as ui data with currency already calculated?
                // rewardAmountLimit: statusResult.Status.RewardAmountLimit,
                // emailsAvailable: statusResult.Status.EmailsAvailable,
                hasReachedRewardLimit: statusResult.Status.RewardAmount >= statusResult.Status.RewardAmountLimit, // TODO: referral: how does this calculation hold up?
                currency: 'USD' as Currency, // TODO: referral: where should this currency come from? Subscription? ReferralInfo?
            },
            /**
             * Total referees that have been invited
             */
            total: referralResult.Total,

            /**
             * Total referees that have paid
             */
            totalSubscribed: referralResult.TotalSubscribed,
            // totalEarned: referralResult.TotalEarned,
            // creditBalance: referralResult.CreditBalance,
        };
    } catch {
        return referralsDefaultValue;
    }
};

const modelThunk = createAsyncModelThunk<Model, ReferralsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return getReferrals(extraArgument.api);
    },
    previous: previousSelector(selectReferrals),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        setInvitedReferrals: (
            state,
            action: PayloadAction<{
                invitedReferrals: Referral[];
            }>
        ) => {
            if (!state.value) {
                return;
            }
            const { invitedReferrals } = action.payload;

            state.value.all = getDeduplicatedReferrals(state.value.all, invitedReferrals);
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const referralsReducer = { [name]: slice.reducer };
export const referralsThunk = modelThunk.thunk;
