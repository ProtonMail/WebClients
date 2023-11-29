import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSubscription } from '@proton/shared/lib/api/payments';
import { FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import { SubscriptionModel, Subscription as tsSubscription } from '@proton/shared/lib/interfaces';
import formatSubscription from '@proton/shared/lib/subscription/format';

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

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());

        if (user.isAdmin && Boolean(user.Subscribed)) {
            const { Subscription, UpcomingSubscription } = await extraArgument.api<{
                Subscription: tsSubscription;
                UpcomingSubscription: tsSubscription;
            }>(getSubscription());
            return formatSubscription(Subscription, UpcomingSubscription);
        }

        return FREE_SUBSCRIPTION as unknown as SubscriptionModel;
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
            if (
                state.value &&
                state.value !== (FREE_SUBSCRIPTION as unknown as SubscriptionModel) &&
                action.payload.User &&
                !action.payload.User.Subscribed
            ) {
                // Do not get any subscription update when user becomes unsubscribed.
                state.value = FREE_SUBSCRIPTION as unknown as SubscriptionModel;
                return;
            }

            if (state.value && action.payload.Subscription) {
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
            }
        });
    },
});

export const subscriptionReducer = { [name]: slice.reducer };
export const subscriptionThunk = modelThunk.thunk;
