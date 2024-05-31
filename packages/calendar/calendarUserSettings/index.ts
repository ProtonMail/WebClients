import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, serverEvent, getInitialModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

interface State {
    calendarUserSettings: ModelState<CalendarUserSettings>;
}

const name = 'calendarUserSettings' as const;
type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCalendarUserSettings = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
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
    reducers: {},
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
