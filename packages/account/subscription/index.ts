import {
    type PayloadAction,
    type ThunkAction,
    type UnknownAction,
    createSlice,
    miniSerializeError,
    original,
} from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createPromiseCache } from '@proton/redux-utilities';
import { getSubscription } from '@proton/shared/lib/api/payments';
import { FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { Subscription, SubscriptionModel, User } from '@proton/shared/lib/interfaces';
import formatSubscription from '@proton/shared/lib/subscription/format';
import { isAdmin, isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { type UserState, userThunk } from '../user';

const name = 'subscription';

enum ValueType {
    dummy,
    complete,
}

interface State extends UserState {
    [name]: ModelState<SubscriptionModel> & { meta?: { type: ValueType } };
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectSubscription = (state: State) => state[name];

const freeSubscription = FREE_SUBSCRIPTION as unknown as SubscriptionModel;

const canFetch = (user: User) => {
    return isAdmin(user) && isPaid(user);
};

const initialState: SliceState = {
    value: undefined,
    error: undefined,
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
            state.meta = { type: action.payload.type };
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.value = undefined;
            state.meta = { type: ValueType.complete };
        },
    },
    extraReducers: (builder) => {
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
                 * In contrast to {@link getSubscriptionModel()}, events have a different structure for the
                 * UpcomingSubscription. For example, {@link getSubscription()} endpoint returns the both properties on the top
                 * level: { Subscription: { ... }, UpcomingSubscription: { ... }} Events make the upcoming subscription nested:
                 * { Subscription: { UpcomingSubscription: { ... }, ...} }
                 */
                state.value = formatSubscription(
                    eventsSubscription,
                    eventsSubscription.UpcomingSubscription || undefined
                );
                state.error = undefined;
                state.meta = { type: ValueType.complete };
            } else {
                const isFreeSubscription = original(state)?.meta?.type === ValueType.dummy;

                // User who downgrades does not receive a subscription update, so this resets it to free.
                if (!isFreeSubscription && action.payload.User && !canFetch(action.payload.User)) {
                    state.value = freeSubscription;
                    state.error = undefined;
                    state.meta = { type: ValueType.dummy };
                }

                // Otherwise, if there was no subscription update received, but the user became an admin, we reset the value so that it gets re-fetched. Typically happens for members who get promoted.
                if (isFreeSubscription && action.payload.User && canFetch(action.payload.User)) {
                    state.value = undefined;
                    state.error = undefined;
                    state.meta = { type: ValueType.complete };
                }
            }
        });
    },
});

const promiseCache = createPromiseCache<Model>();
const modelThunk = (options?: {
    forceFetch?: boolean;
}): ThunkAction<Promise<Model>, State, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            const oldValue = selectSubscription(getState());
            if (oldValue?.value !== undefined && !options?.forceFetch) {
                return Promise.resolve(oldValue.value);
            }
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            if (!canFetch(user)) {
                return { value: freeSubscription, type: ValueType.dummy };
            }
            const { Subscription, UpcomingSubscription } = await extraArgument.api<{
                Subscription: Subscription;
                UpcomingSubscription: Subscription;
            }>(getSubscription());
            return {
                value: formatSubscription(Subscription, UpcomingSubscription),
                type: ValueType.complete,
            };
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
        return promiseCache(select, cb);
    };
};

export const subscriptionReducer = { [name]: slice.reducer };
export const subscriptionThunk = modelThunk;
