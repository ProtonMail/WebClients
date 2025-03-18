import { createAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { getSettings, setSettings } from '../../utils/cache';
import { type WalletThemeOption, getWalletDefaultTheme } from '../../utils/theme';
import type { WalletThunkArguments } from '../thunk';

const name = 'localSettings' as const;

export interface LocalSettings {
    theme: WalletThemeOption;
}

export interface LocalSettingsState {
    [name]: ModelState<LocalSettings>;
}

type SliceState = LocalSettingsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectSettings = (state: LocalSettingsState) => state[name];

export const DEFAULT_LOCAL_SETTINGS = {
    theme: getWalletDefaultTheme(),
};
const initialState = getInitialModelState<Model>(DEFAULT_LOCAL_SETTINGS);

const modelThunk = createAsyncModelThunk<Model, LocalSettingsState, WalletThunkArguments>(`${name}/fetch`, {
    miss: async () => {
        const settings = getSettings();
        return {
            theme: settings.theme ?? getWalletDefaultTheme(),
        };
    },
    previous: previousSelector(selectSettings),
});

export const themeChange = createAction('theme/update', (payload: { theme: WalletThemeOption }) => ({
    payload,
}));

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(themeChange, (state, action) => {
            if (state.value) {
                if (action.payload.theme) {
                    const settings = getSettings();
                    setSettings({ ...settings, theme: action.payload.theme });
                    state.value.theme = action.payload.theme;
                }
            }
        });
    },
});

export const settingsReducer = { [name]: slice.reducer };
export const settingsThunk = modelThunk.thunk;
