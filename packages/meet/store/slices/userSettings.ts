import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { getMeetUserSettings, updateMeetUserSettingsCall } from '@proton/shared/lib/api/meet';
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

export const updateUserSettingsThunk = createAsyncThunk<
    Partial<Model>,
    Partial<Model>,
    { dispatch: ProtonDispatch<UserSettingsState>; extra: ProtonThunkArguments }
>(`${name}/update`, async (settings, { dispatch, extra }) => {
    // The update replaces the settings as a whole, and nothing invalidates the cached copy, so the
    // untouched fields have to come from a fresh read.
    const currentSettings = await dispatch(modelThunk.thunk({ cache: CacheType.None }));

    await extra.api(updateMeetUserSettingsCall({ ...currentSettings, ...settings }));

    return settings;
});

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder.addCase(updateUserSettingsThunk.fulfilled, (state, action) => {
            if (state.value) {
                state.value = { ...state.value, ...action.payload };
            }
        });
    },
});

export const userSettingsReducer = { [name]: slice.reducer };
export const userSettingsThunk = modelThunk.thunk;
