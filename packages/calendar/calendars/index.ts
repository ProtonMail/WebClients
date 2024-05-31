import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AddressesState, ModelState, getInitialModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryCalendars } from '@proton/shared/lib/api/calendars';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

export interface CalendarsState extends AddressesState {
    calendars: ModelState<CalendarWithOwnMembers[]>;
}

const name = 'calendars' as const;
type SliceState = CalendarsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCalendars = (state: CalendarsState) => state[name];

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
