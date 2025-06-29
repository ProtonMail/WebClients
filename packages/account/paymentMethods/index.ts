import { createSlice } from '@reduxjs/toolkit';

import {
    type SavedPaymentMethod,
    formatPaymentMethod,
    formatPaymentMethods,
    getPaymentMethods,
} from '@proton/payments';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import updateCollection, { sortCollection } from '@proton/shared/lib/helpers/updateCollection';

import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'paymentMethods' as const;

interface PaymentMethodsState {
    [name]: ModelState<SavedPaymentMethod[]>;
}

type SliceState = PaymentMethodsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPaymentMethods = (state: PaymentMethodsState) => state.paymentMethods;

const modelThunk = createAsyncModelThunk<Model, PaymentMethodsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => getPaymentMethods(extraArgument.api),
    previous: previousSelector(selectPaymentMethods),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.PaymentMethods) {
                state.value = sortCollection(
                    'Order',
                    updateCollection({
                        model: state.value,
                        itemKey: 'PaymentMethod',
                        events: action.payload.PaymentMethods,
                        create: formatPaymentMethod,
                    })
                );

                state.value = formatPaymentMethods(state.value);
            }
        });
    },
});

export const paymentMethodsReducer = { [name]: slice.reducer };
export const paymentMethodsThunk = modelThunk.thunk;
