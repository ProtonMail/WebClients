import { createAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { WasmUserSettings as WalletSettings, WasmBitcoinUnit } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'wallet_settings' as const;

interface State {
    [name]: ModelState<WalletSettings>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectWalletSettings = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.walletApi
            .clients()
            .settings.getUserSettings()
            .then((settingsData) => {
                return settingsData[0];
            });
    },
    previous: previousSelector(selectWalletSettings),
});

export const setBitcoinUnitEvent = createAction('setBitcoinUnit', (payload: WasmBitcoinUnit) => ({ payload }));
export const setTwoFaThresholdEvent = createAction('setTwoFaThreshold', (payload: number) => ({ payload }));

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder
            .addCase(serverEvent, () => {
                // TODO: event loop
            })
            .addCase(setBitcoinUnitEvent, (state, { payload }) => {
                if (state.value) {
                    state.value.BitcoinUnit = payload;
                }
            })
            .addCase(setTwoFaThresholdEvent, (state, { payload }) => {
                if (state.value) {
                    state.value.TwoFactorAmountThreshold = payload;
                }
            });
    },
});

export const walletSettingsReducer = { [name]: slice.reducer };
export const walletSettingsThunk = modelThunk.thunk;
