import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { editMeetUserSettingsLiveCaptionsLocaleCall, getMeetUserSettings } from '@proton/shared/lib/api/meet';
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

export const updateLiveCaptionsLocaleThunk = createAsyncThunk<
    Model,
    string | null,
    { dispatch: ProtonDispatch<UserSettingsState>; extra: ProtonThunkArguments }
>(`${name}/updateLiveCaptionsLocale`, async (locale, { extra }) => {
    const { UserSettings } = await extra.api<{ UserSettings: Model }>(
        editMeetUserSettingsLiveCaptionsLocaleCall({ LiveCaptionsLocale: locale })
    );

    return UserSettings;
});

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder.addCase(updateLiveCaptionsLocaleThunk.fulfilled, (state, action) => {
            if (state.value) {
                state.value = action.payload;
            }
        });
    },
});

export const userSettingsReducer = { [name]: slice.reducer };
export const userSettingsThunk = modelThunk.thunk;
