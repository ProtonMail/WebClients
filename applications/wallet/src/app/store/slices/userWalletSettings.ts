import { createAction, createSlice } from '@reduxjs/toolkit';

import { ModelState, getInitialModelState } from '@proton/account';
import { WasmBitcoinUnit, WasmUserSettings } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { WalletThunkArguments } from '../thunk';

const name = 'user_wallet_setting' as const;

export interface UserWalletSettingsState {
    [name]: ModelState<WasmUserSettings>;
}

type SliceState = UserWalletSettingsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const userWalletSettingsChange = createAction(
    'settings change',
    (payload: { bitcoinUnit: WasmBitcoinUnit }) => ({
        payload,
    })
);

export const selectUserWalletSettings = (state: UserWalletSettingsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, UserWalletSettingsState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.walletApi
            .clients()
            .settings.getUserSettings()
            .then((settings) => {
                return settings[0];
            });
    },
    previous: previousSelector(selectUserWalletSettings),
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(userWalletSettingsChange, (state, action) => {
            if (state.value) {
                if (action.payload.bitcoinUnit) {
                    state.value.BitcoinUnit = action.payload.bitcoinUnit;
                }
            }
        });
    },
});

export const userWalletSettingsReducer = { [name]: slice.reducer };
export const userWalletSettingsThunk = modelThunk.thunk;
