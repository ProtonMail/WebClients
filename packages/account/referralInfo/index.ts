import { createSlice } from '@reduxjs/toolkit';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import type { Currency } from '@proton/payments';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getReferralInfo as getReferralInfoApi } from '@proton/shared/lib/api/core/referrals';
import { HOUR } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

interface ReferralInfo {
    currency: string;
    refereeRewardAmount: number;
    referrerRewardAmount: number;
    maxRewardAmount: number;
    uiData: {
        refereeRewardAmount: string;
        referrerRewardAmount: string;
        maxRewardAmount: string;
    };
}

const constructReferralInfo = (
    currency: Currency,
    refereeRewardAmount: number,
    referrerRewardAmount: number,
    maxRewardAmount: number
): ReferralInfo => {
    return {
        currency,
        refereeRewardAmount,
        referrerRewardAmount,
        maxRewardAmount,
        uiData: {
            refereeRewardAmount: getSimplePriceString(currency, refereeRewardAmount),
            referrerRewardAmount: getSimplePriceString(currency, referrerRewardAmount),
            maxRewardAmount: getSimplePriceString(currency, maxRewardAmount),
        },
    };
};

export const referralInfoDefaultValue = constructReferralInfo('USD', 2_000, 2_000, 100_000);

const name = 'referralInfo' as const;

export interface ReferralInfoState {
    [name]: ModelState<ReferralInfo>;
}

type SliceState = ReferralInfoState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectReferralInfo = (state: ReferralInfoState) => state[name];
const getReferralInfo = async (api: Api) => {
    try {
        const { Currency, RefereeRewardAmount, ReferrerRewardAmount, MaxRewardAmount } =
            await api(getReferralInfoApi());
        return constructReferralInfo(Currency, RefereeRewardAmount, ReferrerRewardAmount, MaxRewardAmount);
    } catch {
        return referralInfoDefaultValue;
    }
};

const modelThunk = createAsyncModelThunk<Model, ReferralInfoState, ProtonThunkArguments>(`${name}/fetch`, {
    expiry: HOUR, // Cache for 1 hour with stale while refetch strategy
    miss: ({ extraArgument }) => {
        return getReferralInfo(extraArgument.api);
    },
    previous: previousSelector(selectReferralInfo),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const referralInfoReducer = { [name]: slice.reducer };
export const referralInfoThunk = modelThunk.thunk;
