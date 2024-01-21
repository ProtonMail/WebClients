import { createSlice, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSubscription } from '@proton/shared/lib/api/payments';
import { FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import { SubscriptionModel, User, Subscription as tsSubscription } from '@proton/shared/lib/interfaces';
import formatSubscription from '@proton/shared/lib/subscription/format';
import { isAdmin, isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'subscription';

interface State extends UserState {
    [name]: ModelState<SubscriptionModel>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectSubscription = (state: State) => state[name];

const freeSubscription = FREE_SUBSCRIPTION as unknown as SubscriptionModel;

const canFetch = (user: User) => {
    return isAdmin(user) && isPaid(user);
};

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());

        if (!canFetch(user)) {
            return freeSubscription;
        }

        const { Subscription, UpcomingSubscription } = await extraArgument.api<{
            Subscription: tsSubscription;
            UpcomingSubscription: tsSubscription;
        }>(getSubscription());
        return formatSubscription(Subscription, UpcomingSubscription);
    },
    previous: previousSelector(selectSubscription),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
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
            } else {
                const isFreeSubscription = original(state)?.value === freeSubscription;

                // User who downgrades does not receive a subscription update, so this resets it to free.
                if (!isFreeSubscription && action.payload.User && !canFetch(action.payload.User)) {
                    state.value = freeSubscription;
                }

                // Otherwise, if there was no subscription update received, but the user became an admin, we reset the value so that it gets re-fetched. Typically happens for members who get promoted.
                if (isFreeSubscription && action.payload.User && canFetch(action.payload.User)) {
                    state.value = undefined;
                    state.error = undefined;
                }
            }
        });
    },
});

export const subscriptionReducer = { [name]: slice.reducer };
export const subscriptionThunk = modelThunk.thunk;
