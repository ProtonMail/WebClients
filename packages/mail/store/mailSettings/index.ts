import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getMailSettings } from '@proton/shared/lib/api/mailSettings';
import updateObject from '@proton/shared/lib/helpers/updateObject';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

const name = 'mailSettings' as const;

export interface MailSettingState {
    [name]: ModelState<MailSettings>;
}

type SliceState = MailSettingState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMailSettings = (state: MailSettingState) => state[name];
export const selectMailSettingsLoading = (state: MailSettingState) => {
    const { value, error } = selectMailSettings(state);
    return value === undefined && error === undefined;
};

const modelThunk = createAsyncModelThunk<Model, MailSettingState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ MailSettings: MailSettings }>(getMailSettings()).then(({ MailSettings }) => {
            return MailSettings;
        });
    },
    previous: previousSelector(selectMailSettings),
});

const initialState = getInitialModelState<Model>(DEFAULT_MAIL_SETTINGS);
const slice = createSlice({
    name,
    initialState,
    reducers: {
        updateMailSettings: (state, action: PayloadAction<MailSettings>) => {
            if (state.value) {
                state.value = updateObject(state.value, action.payload);
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.MailSettings) {
                state.value = updateObject(state.value, action.payload.MailSettings);
            }
        });
    },
});

export const mailSettingsReducer = { [name]: slice.reducer };
export const mailSettingsThunk = modelThunk.thunk;
export const mailSettingsActions = slice.actions;
