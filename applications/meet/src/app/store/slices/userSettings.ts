import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState } from '@proton/account';
import type { UserSettings } from '@proton/meet/types/response-types';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

const name = 'meet_user_settings' as const;

export interface UserSettingsState {
    [name]: ModelState<UserSettings>;
}

type SliceState = UserSettingsState[typeof name];
type Model = NonNullable<SliceState['value']>;

const getUserSettings = {
    method: 'get',
    url: `meet/v1/user-settings`,
    silence: true,
};

export const selectUserSettings = (state: UserSettingsState) => {
    return state[name];
};

const modelThunk = createAsyncModelThunk<Model, UserSettingsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) =>
        extraArgument
            .api<{ UserSettings: UserSettings }>(getUserSettings)
            .then(({ UserSettings }) => UserSettings)
            .catch((err) => {
                captureMessage('Error getting user settings', { level: 'error', extra: { error: err } });
                throw err;
            }),
    previous: previousSelector(selectUserSettings),
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const userSettingsReducer = { [name]: slice.reducer };
export const userSettingsThunk = modelThunk.thunk;
