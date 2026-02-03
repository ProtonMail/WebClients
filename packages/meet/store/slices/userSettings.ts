import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getMeetUserSettings } from '@proton/shared/lib/api/meet';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { UserSettings } from '@proton/shared/lib/interfaces/Meet';

const name = 'meet_user_settings' as const;

export interface UserSettingsState {
    [name]: ModelState<UserSettings>;
}

type SliceState = UserSettingsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserSettings = (state: UserSettingsState) => {
    return state[name];
};

const modelThunk = createAsyncModelThunk<Model, UserSettingsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) =>
        extraArgument
            .api<{ UserSettings: UserSettings }>(getMeetUserSettings)
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
