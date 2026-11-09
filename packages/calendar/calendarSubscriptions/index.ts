import {
    type PayloadAction,
    type ThunkAction,
    type UnknownAction,
    addListener,
    createSlice,
    miniSerializeError,
} from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { cacheHelper, createPromiseMapStore } from '@proton/redux-utilities/promiseStore';
import { getSubscriptionParameters } from '@proton/shared/lib/api/calendars';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/calendar';
import { getIsCalendarSubscriptionEventManagerUpdate } from '@proton/shared/lib/calendar/subscribe/helpers';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type {
    CalendarSubscription,
    CalendarSubscriptionResponse,
} from '@proton/shared/lib/interfaces/calendar/Subscription';
import noop from '@proton/utils/noop';

import { calendarServerEvent } from '../calendarServerEvent';
import { type CalendarsState, calendarsThunk, selectCalendars } from '../calendars';

const name = 'calendarSubscriptions' as const;

export interface CalendarSubscriptionsState {
    [name]: { [calendarID: string]: ModelState<CalendarSubscription> | undefined };
}

type SliceState = CalendarSubscriptionsState[typeof name];

export const selectCalendarSubscriptions = (state: CalendarSubscriptionsState) => state[name];

const initialState: SliceState = {};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        fulfilled: (state, action: PayloadAction<{ id: string; value: CalendarSubscription }>) => {
            state[action.payload.id] = {
                value: action.payload.value,
                error: undefined,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: getFetchedEphemeral() },
            };
        },
        rejected: (state, action: PayloadAction<{ id: string; value: any }>) => {
            state[action.payload.id] = {
                // Keep what we had, so a failed refresh doesn't drop the calendar's sync status
                value: state[action.payload.id]?.value,
                error: action.payload.value,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: undefined },
            };
        },
    },
    extraReducers: (builder) => {
        // Sync status changes come from the per-calendar event loop
        builder.addCase(calendarServerEvent, (state, action) => {
            for (const event of action.payload.CalendarSubscriptions || []) {
                const subscription = state[event.ID]?.value;
                if (subscription && getIsCalendarSubscriptionEventManagerUpdate(event)) {
                    Object.assign(subscription, event.CalendarSubscription);
                }
            }
        });
    },
});

const promiseStore = createPromiseMapStore<CalendarSubscription>();

export const calendarSubscriptionThunk = ({
    calendarID,
    cache,
}: {
    calendarID: string;
    cache?: CacheType;
}): ThunkAction<Promise<CalendarSubscription>, CalendarSubscriptionsState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => selectCalendarSubscriptions(getState())[calendarID];
        const cb = async () => {
            try {
                const { CalendarSubscription } = await extraArgument.api<CalendarSubscriptionResponse>(
                    getSubscriptionParameters(calendarID)
                );
                dispatch(slice.actions.fulfilled({ id: calendarID, value: CalendarSubscription }));
                return CalendarSubscription;
            } catch (error) {
                dispatch(slice.actions.rejected({ id: calendarID, value: miniSerializeError(error) }));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, key: calendarID, select, cb, cache });
    };
};

/**
 * Refreshes the subscriptions of the subscribed calendars, then fetches the ones of calendars that appear later,
 * until the returned function is called.
 */
export const watchCalendarSubscriptionsThunk = (): ThunkAction<
    () => void,
    CalendarSubscriptionsState & CalendarsState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return (dispatch) => {
        const fetchSubscriptions = (calendars: CalendarWithOwnMembers[] = [], cache?: CacheType) => {
            for (const calendar of calendars) {
                if (getIsSubscribedCalendar(calendar)) {
                    dispatch(calendarSubscriptionThunk({ calendarID: calendar.ID, cache })).catch(noop);
                }
            }
        };

        // Sync status updates only arrive while the calendars are listened to, so skip the cache once
        dispatch(calendarsThunk())
            .then((calendars) => fetchSubscriptions(calendars, CacheType.None))
            .catch(noop);

        // The listener middleware turns this action into the function that removes the listener
        return dispatch(
            addListener.withTypes<CalendarsState>()({
                predicate: (action, currentState, previousState) =>
                    selectCalendars(currentState).value !== selectCalendars(previousState).value,
                effect: (action, listenerApi) => fetchSubscriptions(selectCalendars(listenerApi.getState()).value),
            })
        ) as unknown as () => void;
    };
};

export const calendarSubscriptionsReducer = { [name]: slice.reducer };
