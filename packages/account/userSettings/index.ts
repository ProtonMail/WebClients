import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getSettings } from '@proton/shared/lib/api/settings';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import type { ModelState } from '../interface';

const name = 'userSettings';

export interface UserSettingsState {
    [name]: ModelState<UserSettings>;
}

type SliceState = UserSettingsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserSettings = (state: UserSettingsState) => state.userSettings;

const modelThunk = createAsyncModelThunk<Model, UserSettingsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ UserSettings: UserSettings }>(getSettings()).then(({ UserSettings }) => {
            return UserSettings;
        });
    },
    previous: previousSelector(selectUserSettings),
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
        builder
            .addCase(initEvent, (state, action) => {
                if (action.payload.UserSettings) {
                    state.value = action.payload.UserSettings;
                }
            })
            .addCase(serverEvent, (state, action) => {
                if (state.value && action.payload.UserSettings) {
                    state.value = updateObject(state.value, action.payload.UserSettings);
                }
            });
    },
});

export const userSettingsReducer = { [name]: slice.reducer };
export const userSettingsThunk = modelThunk.thunk;
