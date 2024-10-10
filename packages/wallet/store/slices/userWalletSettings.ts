import { createAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState } from '@proton/account';
import { type WasmBitcoinUnit, type WasmUserSettings } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { DEFAULT_DISPLAY_BITCOIN_UNIT, DEFAULT_FIAT_CURRENCY } from '../../constants';
import { type WalletThunkArguments } from '../thunk';

const name = 'user_wallet_setting' as const;

export interface UserWalletSettingsState {
    [name]: ModelState<WasmUserSettings>;
}

type SliceState = UserWalletSettingsState[typeof name];
type Model = NonNullable<SliceState['value']> | undefined;

export const DEFAULT_SETTINGS: WasmUserSettings = {
    BitcoinUnit: DEFAULT_DISPLAY_BITCOIN_UNIT,
    FiatCurrency: DEFAULT_FIAT_CURRENCY,
    HideEmptyUsedAddresses: 0,
    TwoFactorAmountThreshold: null,
    ReceiveEmailIntegrationNotification: null,
    ReceiveInviterNotification: null,
    WalletCreated: null,
    AcceptTermsAndConditions: 0,
    ReceiveTransactionNotification: null,
};

export const bitcoinUnitChange = createAction('bitcoin unit change', (payload: { bitcoinUnit: WasmBitcoinUnit }) => ({
    payload,
}));

export const acceptTermsAndConditions = createAction('accept terms and conditions', () => ({ payload: {} }));

export const selectUserWalletSettings = (state: UserWalletSettingsState) => state[name];

const initialState = getInitialModelState<Model>();

const modelThunk = createAsyncModelThunk<Model, UserWalletSettingsState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.walletApi
            .clients()
            .settings.getUserSettings()
            .then((settings) => {
                return settings[0];
            })
            .catch(() => DEFAULT_SETTINGS);
    },
    previous: previousSelector(selectUserWalletSettings),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder
            .addCase(bitcoinUnitChange, (state, action) => {
                if (state.value) {
                    if (action.payload.bitcoinUnit) {
                        state.value.BitcoinUnit = action.payload.bitcoinUnit;
                    }
                }
            })
            .addCase(acceptTermsAndConditions, (state) => {
                if (state.value) {
                    state.value.AcceptTermsAndConditions = 1;
                }
            });
    },
});

export const userWalletSettingsReducer = { [name]: slice.reducer };
export const userWalletSettingsThunk = modelThunk.thunk;
