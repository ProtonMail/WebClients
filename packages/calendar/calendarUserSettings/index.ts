import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import merge from 'lodash/merge';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

const name = 'calendarUserSettings' as const;
interface CalendarSettingState {
    calendarUserSettings: ModelState<CalendarUserSettings>;
}

type SliceState = CalendarSettingState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCalendarUserSettings = (state: CalendarSettingState) => state[name];

const modelThunk = createAsyncModelThunk<Model, CalendarSettingState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument
            .api<{ CalendarUserSettings: CalendarUserSettings }>(getCalendarUserSettings())
            .then(({ CalendarUserSettings }) => {
                return CalendarUserSettings;
            });
    },
    previous: previousSelector(selectCalendarUserSettings),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        update: (state, action: PayloadAction<CalendarUserSettings>) => {
            if (!state.value) {
                return;
            }
            state.value = merge(state.value, action.payload);
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.CalendarUserSettings) {
                state.value = updateObject(state.value, action.payload.CalendarUserSettings);
            }
        });
    },
});

export const calendarSettingsReducer = { [name]: slice.reducer };
export const calendarSettingsThunk = modelThunk.thunk;
export const calendarSettingsActions = slice.actions;
