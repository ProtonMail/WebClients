import { type ThunkAction, type UnknownAction, createSelector } from '@reduxjs/toolkit';

import type { Subscription } from '@proton/payments/core/subscription/interface';
import { toSubscriptionList } from '@proton/payments/core/subscription/multi-subscription-context';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { CacheType } from '@proton/redux-utilities/interface';

import { type SubscriptionState, selectSubscription, subscriptionThunk } from '../subscription';

export const selectAllSubscriptions = createSelector(selectSubscription, (state) => ({
    ...state,
    value: state.value === undefined ? undefined : toSubscriptionList(state.value),
}));

export const allSubscriptionsThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Subscription[]>, SubscriptionState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const subscription = await dispatch(subscriptionThunk(options));
        return toSubscriptionList(subscription);
    };
};
