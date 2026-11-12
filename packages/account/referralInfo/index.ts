import { createSlice } from '@reduxjs/toolkit';

import type { Currency } from '@proton/payments/core/interface';
import { getSimplePriceString } from '@proton/payments/core/price-format';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getReferralInfo as getReferralInfoApi } from '@proton/shared/lib/api/core/referrals';
import { HOUR } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';

type RewardType = 'fixed' | 'percentage';

interface ReferralInfoValues {
    currency: string;
    refereeRewardAmount: number;
    refereeRewardType: RewardType;
    referrerRewardAmount: number;
    maxRewardAmount: number;
    uiData: {
        refereeRewardAmount: string;
        referrerRewardAmount: string;
        maxRewardAmount: string;
    };
}

interface ReferralInfo extends ReferralInfoValues {
    /**
     * Values of the business (B2C2B) referral program. `referrerRewardAmount` is per seat.
     */
    b2c2b: ReferralInfoValues;
}

const constructReferralInfoValues = (
    currency: Currency,
    refereeRewardAmount: number,
    refereeRewardType: RewardType,
    referrerRewardAmount: number,
    maxRewardAmount: number
): ReferralInfoValues => {
    return {
        currency,
        refereeRewardAmount,
        refereeRewardType,
        referrerRewardAmount,
        maxRewardAmount,
        uiData: {
            refereeRewardAmount:
                refereeRewardType === 'percentage'
                    ? `${refereeRewardAmount}%`
                    : getSimplePriceString(currency, refereeRewardAmount),
            referrerRewardAmount: getSimplePriceString(currency, referrerRewardAmount),
            maxRewardAmount: getSimplePriceString(currency, maxRewardAmount),
        },
    };
};

const b2c2bDefaultValue = constructReferralInfoValues('USD', 10, 'percentage', 2_000, 100_000);

export const referralInfoDefaultValue: ReferralInfo = {
    ...constructReferralInfoValues('USD', 2_000, 'fixed', 2_000, 100_000),
    b2c2b: b2c2bDefaultValue,
};

const name = 'referralInfo' as const;

export interface ReferralInfoState {
    [name]: ModelState<ReferralInfo>;
}

type SliceState = ReferralInfoState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectReferralInfo = (state: ReferralInfoState) => state[name];
const fetchReferralInfoValues = async (api: Api, b2c2b?: boolean) => {
    const {
        Currency,
        RefereeRewardAmount,
        RefereeRewardType,
        RefereeDiscountPercentage,
        ReferrerRewardAmount,
        MaxRewardAmount,
    } = await api(getReferralInfoApi({ b2c2b }));
    // The business program reports the referee's reward as a percentage in its own field
    if (b2c2b && typeof RefereeDiscountPercentage === 'number') {
        return constructReferralInfoValues(
            Currency,
            RefereeDiscountPercentage,
            'percentage',
            ReferrerRewardAmount,
            MaxRewardAmount
        );
    }
    // A backend that doesn't know about the program yet answers with the consumer values and no type
    if (b2c2b && !RefereeRewardType) {
        throw new Error('Business referral info not available');
    }
    return constructReferralInfoValues(
        Currency,
        RefereeRewardAmount,
        RefereeRewardType ?? 'fixed',
        ReferrerRewardAmount,
        MaxRewardAmount
    );
};

const getReferralInfo = async (api: Api): Promise<ReferralInfo> => {
    const [consumer, b2c2b] = await Promise.all([
        fetchReferralInfoValues(api).catch(() => undefined),
        fetchReferralInfoValues(api, true).catch(() => b2c2bDefaultValue),
    ]);
    return { ...(consumer ?? referralInfoDefaultValue), b2c2b };
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
