import { createSlice } from '@reduxjs/toolkit';

import { ModelState, getInitialModelState } from '@proton/account';
import { WasmFiatCurrencySymbol, WasmGatewayProvider, WasmPaymentMethod } from '@proton/andromeda';
import { createAsyncModelThunk, getValidModel, handleAsyncModel } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import { isNotStale } from '@proton/shared/lib/helpers/fetchedAt';

import { WalletThunkArguments } from '../thunk';

const name = 'payment_method_by_provider' as const;

export type PaymentMethodsByProvider = Partial<Record<WasmGatewayProvider, WasmPaymentMethod[]>>;
type PaymentMethodsByProviderByFiat = Partial<Record<WasmFiatCurrencySymbol, PaymentMethodsByProvider>>;

export interface PaymentMethodsByProviderState {
    [name]: ModelState<PaymentMethodsByProviderByFiat>;
}

type SliceState = PaymentMethodsByProviderState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPaymentMethodsByProvider = (state: PaymentMethodsByProviderState) => state[name];

const modelThunk = createAsyncModelThunk<
    Model,
    PaymentMethodsByProviderState,
    WalletThunkArguments,
    WasmFiatCurrencySymbol
>(`${name}/fetch`, {
    miss: async ({ extraArgument, options, getState }) => {
        const stateValue = getState()[name].value;
        if (!options?.thunkArg) {
            return stateValue ?? {};
        }

        const fiat = options?.thunkArg;

        return extraArgument.walletApi
            .clients()
            .payment_gateway.getPaymentMethods(fiat)
            .then((paymentMethods) => {
                const paymentMethodsByProvider = paymentMethods.data.reduce((acc, current) => {
                    const provider = current[0];
                    const countries = current[1];

                    return { ...acc, [provider]: countries.data };
                }, {} as PaymentMethodsByProvider);

                return {
                    ...stateValue,
                    [fiat]: paymentMethodsByProvider,
                };
            });
    },
    previous: ({ getState, options }) => {
        const state = getState()[name];
        if (!options?.thunkArg || !state.value) {
            return undefined;
        }

        const fiat = options?.thunkArg;

        if (state.value[fiat]) {
            return getValidModel({
                value: state.value,
                cache: options?.cache ?? (isNotStale(state.meta?.fetchedAt, 10 * MINUTE) ? 'stale' : undefined),
            });
        }

        return undefined;
    },
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

export const paymentMethodsByProviderReducer = { [name]: slice.reducer };
export const paymentMethodsByProviderThunk = modelThunk.thunk;
