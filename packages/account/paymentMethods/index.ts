import { type PayloadAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import {
    type SavedPaymentMethod,
    formatPaymentMethod,
    formatPaymentMethods,
    getPaymentMethods,
    queryPaymentMethod,
} from '@proton/payments';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection, { sortCollection } from '@proton/shared/lib/helpers/updateCollection';
import type { Api } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'paymentMethods' as const;

export interface PaymentMethodsState {
    [name]: ModelState<SavedPaymentMethod[]>;
}

type SliceState = PaymentMethodsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPaymentMethods = (state: PaymentMethodsState) => state.paymentMethods;

const getPaymentMethod = (api: Api, ID: string) => {
    return api<{
        PaymentMethod: SavedPaymentMethod;
    }>(queryPaymentMethod(ID)).then(({ PaymentMethod }) => PaymentMethod);
};

const modelThunk = createAsyncModelThunk<Model, PaymentMethodsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return getPaymentMethods(extraArgument.api).then((PaymentMethods) => {
            return sortCollection('Order', formatPaymentMethods(PaymentMethods));
        });
    },
    previous: previousSelector(selectPaymentMethods),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<SavedPaymentMethod>>) => {
            if (state.value) {
                state.value = sortCollection(
                    'Order',
                    updateCollectionV6(state.value, action.payload, {
                        create: formatPaymentMethod,
                    })
                );

                state.value = formatPaymentMethods(state.value);
            }
        },
    },
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
const paymentMethodActions = slice.actions;
export const paymentMethodsThunk = modelThunk.thunk;

export const paymentMethodsEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, PaymentMethodsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.PaymentsMethods,
            get: (methodID: string) => getPaymentMethod(api, methodID),
            refetch: () => dispatch(paymentMethodsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(paymentMethodActions.eventLoopV6(result)),
        });
    };
};
