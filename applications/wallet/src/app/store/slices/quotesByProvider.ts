import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { WasmGatewayProvider, WasmPaymentMethod, WasmQuote } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';

import type { WalletThunkArguments } from '../thunk';

const name = 'quotes_by_provider' as const;

export type GetQuotesArgs = [number, string, WasmPaymentMethod?, WasmGatewayProvider?];

export type QuotesByProvider = Partial<Record<WasmGatewayProvider, WasmQuote[]>>;
type QuotesByProviderByKey = Partial<Record<string, QuotesByProvider>>;
export const getQuotesByProviderKey = (args: GetQuotesArgs) => {
    const [amount, fiat, paymentMethod, gatewayProvider] = args;
    return `${amount}_${fiat}_${paymentMethod}_${gatewayProvider}`;
};

export interface QuotesByProviderState {
    [name]: ModelState<QuotesByProviderByKey>;
}

type SliceState = QuotesByProviderState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectQuotesByProvider = (state: QuotesByProviderState) => state[name];

const modelThunk = createAsyncModelThunk<Model, QuotesByProviderState, WalletThunkArguments, GetQuotesArgs>(
    `${name}/fetch`,
    {
        miss: async ({ extraArgument, options, getState }) => {
            const stateValue = getState()[name].value;
            if (!options?.thunkArg) {
                return stateValue ?? {};
            }

            const [amount, fiat, paymentMethod, gatewayProvider] = options.thunkArg;
            const key = getQuotesByProviderKey(options.thunkArg);

            return extraArgument.walletApi
                .clients()
                .payment_gateway.getQuotes(amount, fiat, paymentMethod, gatewayProvider)
                .then((quotes) => {
                    const quotesByProvider = quotes.data.reduce((acc, current) => {
                        const provider = current[0];
                        const quotes = current[1];

                        return { ...acc, [provider]: quotes.data };
                    }, {} as QuotesByProvider);

                    return {
                        ...stateValue,
                        [key]: quotesByProvider,
                    };
                });
        },
        expiry: 1 * MINUTE,
        previous: ({ getState, options }) => {
            const state = getState()[name];
            if (!options?.thunkArg || !state.value) {
                return undefined;
            }

            const [amount, fiat, paymentMethod, gatewayProvider] = options?.thunkArg;
            const key = `${amount}_${fiat}_${paymentMethod}_${gatewayProvider}`;

            if (state.value[key]) {
                return state;
            }

            return undefined;
        },
    }
);

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const quotesByProviderReducer = { [name]: slice.reducer };
export const quotesByProviderThunk = modelThunk.thunk;
