import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { type AddressesState, type ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account/initialModelState';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getCalendar, queryCalendars } from '@proton/shared/lib/api/calendars';
import type { CalendarEventV6Response } from '@proton/shared/lib/api/events';
import { CALENDAR_DISPLAY } from '@proton/shared/lib/calendar/constants';
import { APPS } from '@proton/shared/lib/constants';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import type { Api } from '@proton/shared/lib/interfaces';
import {
    CALENDAR_ORDER_BY,
    CALENDAR_RETURN_FLAGS,
    type CalendarWithOwnMembers,
} from '@proton/shared/lib/interfaces/calendar';

export interface CalendarsState extends AddressesState {
    calendars: ModelState<CalendarWithOwnMembers[]>;
}

const name = 'calendars' as const;
type SliceState = CalendarsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCalendars = (state: CalendarsState) => state[name];

export const selectCalendarsWithMembers = (state: CalendarsState) => state[name].value;

const fetchCalendar = (api: Api, calendarID: string) =>
    api(getCalendar(calendarID)).then((result) => {
        return result;
    });

const modelThunk = createAsyncModelThunk<Model, CalendarsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        /* Returning flags in the query calendar call makes the request faster.
         * On the calendar app, we want the app loading to be faster, so we are removing flags from this call.
         * However, if we do so, we need to make later in the process a bootstrap call for each calendar, to get their actual status.
         *
         * On other apps like account for example, making calendars loading faster is not necessary,
         * so we can get the flags, this we will prevent us from running an extra bootstrap call for each calendar.
         */
        const useCalendarFlags =
            extraArgument.config.APP_NAME === APPS.PROTONCALENDAR
                ? CALENDAR_RETURN_FLAGS.NO
                : CALENDAR_RETURN_FLAGS.YES;
        return extraArgument
            .api<{ Calendars: CalendarWithOwnMembers[] }>({
                ...queryCalendars(CALENDAR_ORDER_BY.ASCENDING, useCalendarFlags),
                silence: true,
            })
            .then(({ Calendars }) => {
                return Calendars;
            });
    },
    previous: previousSelector(selectCalendars),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<CalendarWithOwnMembers>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
        updateCalendarVisibility: (
            state,
            action: PayloadAction<{ calendarID: string; memberID: string; display: boolean }>
        ) => {
            if (!state.value) {
                return;
            }
            const calendar = state.value.find(({ ID }) => ID === action.payload.calendarID);
            if (!calendar) {
                return;
            }
            const member = calendar.Members.find(({ ID }) => ID === action.payload.memberID);
            if (!member) {
                return;
            }
            member.Display = action.payload.display ? CALENDAR_DISPLAY.VISIBLE : CALENDAR_DISPLAY.HIDDEN;
        },
        updateCalendars: (state, action: PayloadAction<CalendarWithOwnMembers[]>) => {
            state.value = action.payload;
            state.error = undefined;
        },
        // TODO: This should be merged with the calendar state
        updateCalendarFlags(state, action: PayloadAction<{ calendarID: string; flags: number; memberID: string }>) {
            if (!state.value) {
                return;
            }
            const calendar = state.value.find(({ ID }) => ID === action.payload.calendarID);
            if (!calendar) {
                return;
            }
            const member = calendar.Members.find(({ ID }) => ID === action.payload.memberID);
            if (!member) {
                return;
            }
            member.Flags = action.payload.flags;
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const calendarsReducer = { [name]: slice.reducer };
export const calendarsActions = slice.actions;
export const calendarsThunk = modelThunk.thunk;

export const calendarsEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CalendarEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, CalendarsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.Calendars,
            get: (ID) => fetchCalendar(api, ID),
            refetch: () => dispatch(calendarsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(calendarsActions.eventLoopV6(result)),
        });
    };
};
