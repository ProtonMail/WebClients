import { createSlice } from '@reduxjs/toolkit';

import type { ModelState, UserSettingsState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getDirectoryCalendars } from '@proton/shared/lib/api/calendars';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import type { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';

export interface HolidayCalendarsState extends UserSettingsState {
    holidayCalendars: ModelState<HolidaysDirectoryCalendar[]>;
}

const name = 'holidayCalendars' as const;
type SliceState = HolidayCalendarsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectHolidayCalendars = (state: HolidayCalendarsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, HolidayCalendarsState, ProtonThunkArguments>(`${name}/fetch`, {
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

export const holidayCalendarsReducer = { [name]: slice.reducer };
export const holidayCalendarsThunk = modelThunk.thunk;
