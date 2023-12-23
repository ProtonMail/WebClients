import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, UserSettingsState, selectUserSettings } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getDirectoryCalendars } from '@proton/shared/lib/api/calendars';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import type { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';

interface State extends UserSettingsState {
    holidayCalendars: ModelState<HolidaysDirectoryCalendar[]>;
}

const name = 'holidayCalendars' as const;
type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectHolidayCalendars = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument
            .api<{ Calendars: HolidaysDirectoryCalendar[] }>(getDirectoryCalendars(CALENDAR_TYPE.HOLIDAYS))
            .then(({ Calendars }) => {
                return Calendars;
            });
    },
    previous: previousSelector(selectHolidayCalendars),
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
    },
});

export const startHolidayCalendarsListener = (startListening: SharedStartListening<State>) => {
    startListening({
        predicate: (action, currentState, nextState) => {
            const currentCalendars = selectHolidayCalendars(currentState);
            if (!currentCalendars?.value) {
                return false;
            }
            const currentUserSettings = selectUserSettings(currentState).value;
            const nextUserSettings = selectUserSettings(nextState).value;
            return Boolean(currentUserSettings?.Locale && currentUserSettings.Locale !== nextUserSettings?.Locale);
        },
        effect: async (action, listenerApi) => {
            listenerApi.dispatch(modelThunk.thunk({ forceFetch: true }));
        },
    });
};

export const holidayCalendarsReducer = { [name]: slice.reducer };
export const holidayCalendarsThunk = modelThunk.thunk;
