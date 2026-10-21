import { type ThunkAction, type UnknownAction, createSelector } from '@reduxjs/toolkit';

import { getSubscriptionsArray } from '@proton/payments/core/subscription/helpers';
import type { MaybeFreeSubscription, Subscription } from '@proton/payments/core/subscription/interface';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { CacheType } from '@proton/redux-utilities/interface';

import { type SubscriptionState, selectSubscription, subscriptionThunk } from '../subscription';

export const toAllSubscriptions = (subscription: MaybeFreeSubscription): Subscription[] => {
    if (!isPaidSubscription(subscription)) {
        return [];
    }

    return getSubscriptionsArray(subscription).map((it) => ({ ...it, SecondarySubscriptions: undefined }));
};

export const selectAllSubscriptions = createSelector(selectSubscription, (state) => ({
    ...state,
    value: state.value === undefined ? undefined : toAllSubscriptions(state.value),
}));

export const allSubscriptionsThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Subscription[]>, SubscriptionState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const subscription = await dispatch(subscriptionThunk(options));
        return toAllSubscriptions(subscription);
    };
};
