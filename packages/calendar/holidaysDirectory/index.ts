import { createSlice } from '@reduxjs/toolkit';

import type { ModelState, UserSettingsState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getDirectoryCalendars } from '@proton/shared/lib/api/calendars';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import type { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';

const name = 'holidaysDirectory' as const;

export interface HolidaysDirectoryState extends UserSettingsState {
    [name]: ModelState<HolidaysDirectoryCalendar[]>;
}

type SliceState = HolidaysDirectoryState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectHolidaysDirectory = (state: HolidaysDirectoryState) => state[name];

const modelThunk = createAsyncModelThunk<Model, HolidaysDirectoryState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument
            .api<{ Calendars: HolidaysDirectoryCalendar[] }>({
                ...getDirectoryCalendars(CALENDAR_TYPE.HOLIDAYS),
                silence: true,
            })
            .then(({ Calendars }) => {
                return Calendars;
            });
    },
    previous: previousSelector(selectHolidaysDirectory),
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

export const holidaysDirectoryReducer = { [name]: slice.reducer };
export const holidaysDirectoryThunk = modelThunk.thunk;
