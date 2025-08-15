import {
    type PayloadAction,
    type ThunkAction,
    type UnknownAction,
    createSlice,
    miniSerializeError,
    original,
} from '@reduxjs/toolkit';

import { FREE_SUBSCRIPTION, type Subscription, getSubscription, getSubscriptionV5DynamicPlans } from '@proton/payments';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { CacheType } from '@proton/redux-utilities';
import {
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import { getIsMissingScopeError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { User } from '@proton/shared/lib/interfaces';
import formatSubscription from '@proton/shared/lib/subscription/format';
import { isAdmin, isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import type { ModelState } from '../interface';
import { type UserState, userFulfilled, userThunk } from '../user';

const name = 'subscription' as const;

enum ValueType {
    dummy,
    complete,
}

export interface SubscriptionState extends UserState {
    [name]: ModelState<Subscription> & { meta: { type: ValueType } };
}

type SliceState = SubscriptionState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectSubscription = (state: SubscriptionState) => state[name];

const freeSubscription = FREE_SUBSCRIPTION as unknown as Subscription;

const canFetch = (user: User) => {
    return isAdmin(user) && isPaid(user);
};

const catFetchSecondarySubscriptions = (user: User) => {
    return isAdmin(user) && isPaid(user) && user.HasMultipleSubscriptions;
};

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: {
        type: ValueType.dummy,
        fetchedAt: 0,
        fetchedEphemeral: undefined,
    },
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<{ value: Model; type: ValueType }>) => {
            state.value = action.payload.value;
            state.error = undefined;
            state.meta.type = action.payload.type;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
        },
    },
    extraReducers: (builder) => {
        const handleUserUpdate = (state: SubscriptionState['subscription'], user: User | undefined) => {
            if (!state.value || !user) {
                return;
            }

            const isFreeSubscription = original(state)?.meta?.type === ValueType.dummy;

            // User who downgrades does not receive a subscription update, so this resets it to free.
            if (!isFreeSubscription && user && !canFetch(user)) {
                state.value = freeSubscription;
                state.error = undefined;
                state.meta.type = ValueType.dummy;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }

            // Otherwise, if there was no subscription update received, but the user became an admin, we reset the value so that it gets re-fetched. Typically happens for members who get promoted.
            if (isFreeSubscription && user && canFetch(user)) {
                state.error = undefined;
                state.meta.type = ValueType.complete;
                state.meta.fetchedEphemeral = undefined;
                state.meta.fetchedAt = 0;
            }
        };

        builder.addCase(initEvent, (state, action) => {
            handleUserUpdate(state, action.payload.User);
        });
        builder.addCase(userFulfilled, (state, action) => {
            handleUserUpdate(state, action.payload);
        });

        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.Subscription) {
                const events = action.payload.Subscription;
                const eventsSubscription = updateObject(state.value, events);

                /**
                 * There are two possible cases in the events: UpcomingSubscription created and UpcomingSubscription deleted.
                 * This branch handles the deletion case, whereas {@link updateObject()} above handles the creation case.
                 */
                if (events.UpcomingSubscription === undefined && eventsSubscription) {
                    delete eventsSubscription.UpcomingSubscription;
                }

                /**
                 * In contrast to {@link getSubscription()}, events have a different structure for the
                 * UpcomingSubscription. For example, {@link getSubscription()} endpoint returns the both properties on the top
                 * level: { Subscription: { ... }, UpcomingSubscription: { ... }} Events make the upcoming subscription nested:
                 * { Subscription: { UpcomingSubscription: { ... }, ...} }
                 */
                state.value = formatSubscription(
                    eventsSubscription,
                    eventsSubscription.UpcomingSubscription || undefined,
                    state.value.SecondarySubscriptions
                );
                state.error = undefined;
                state.meta.type = ValueType.complete;
            } else {
                handleUserUpdate(state, action.payload.User);
            }
        });
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectSubscription);

const modelThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Model>, SubscriptionState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options });
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            const defaultValue = {
                value: freeSubscription,
                type: ValueType.dummy,
            };
            if (!canFetch(user)) {
                return defaultValue;
            }
            try {
                const primarySubscriptionPromise = extraArgument.api<{
                    Subscription: Subscription;
                    UpcomingSubscription: Subscription;
                }>(getSubscription());

                const secondarySubscriptionsPromise = catFetchSecondarySubscriptions(user)
                    ? getSubscriptionV5DynamicPlans(extraArgument.api).catch(() => undefined)
                    : undefined;

                const [{ Subscription, UpcomingSubscription }, secondarySubscriptions] = await Promise.all([
                    primarySubscriptionPromise,
                    secondarySubscriptionsPromise,
                ]);

                const filteredSecondarySubscriptions = secondarySubscriptions?.filter(
                    (it) => it.ID !== Subscription.ID
                );

                return {
                    value: formatSubscription(
                        Subscription,
                        UpcomingSubscription,
                        filteredSecondarySubscriptions && filteredSecondarySubscriptions.length > 0
                            ? filteredSecondarySubscriptions
                            : undefined
                    ),
                    type: ValueType.complete,
                };
            } catch (e: any) {
                if (getIsMissingScopeError(e)) {
                    return defaultValue;
                }
                throw e;
            }
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending());
                const payload = await getPayload();
                dispatch(slice.actions.fulfilled(payload));
                return payload.value;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, select, cb, cache: options?.cache });
    };
};

export const subscriptionReducer = { [name]: slice.reducer };
export const subscriptionThunk = modelThunk;
export * from './startListeningToPlanNameChange';
