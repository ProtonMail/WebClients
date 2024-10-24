import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { AddressesState, ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account/initialModelState';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryCalendars } from '@proton/shared/lib/api/calendars';
import { CALENDAR_DISPLAY } from '@proton/shared/lib/calendar/constants';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

export interface CalendarsState extends AddressesState {
    calendars: ModelState<CalendarWithOwnMembers[]>;
}

const name = 'calendars' as const;
type SliceState = CalendarsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCalendars = (state: CalendarsState) => state[name];

export const selectCalendarsWithMembers = (state: CalendarsState) => state[name].value;

const modelThunk = createAsyncModelThunk<Model, CalendarsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument
            .api<{ Calendars: CalendarWithOwnMembers[] }>({
                ...queryCalendars(),
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
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const calendarsReducer = { [name]: slice.reducer };
export const calendarsActions = slice.actions;
export const calendarsThunk = modelThunk.thunk;
