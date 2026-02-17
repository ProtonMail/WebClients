import {
    type PayloadAction,
    type ThunkAction,
    type UnknownAction,
    createAction,
    createSlice,
    miniSerializeError,
} from '@reduxjs/toolkit';

import { getPaymentMethodStatus } from '@proton/payments/core/api/api';
import type { PaymentStatus } from '@proton/payments/core/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'paymentStatus' as const;

export interface PaymentStatusState {
    [name]: ModelState<PaymentStatus>;
}

type SliceState = PaymentStatusState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPaymentStatus = (state: PaymentStatusState) => state.paymentStatus;

export const changeBillingAddress = createAction<Pick<PaymentStatus, 'CountryCode' | 'State' | 'ZipCode'>>(
    `${name}/changeBillingAddress`
);

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<Model>) => {
            state.value = action.payload;
            state.error = undefined;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
    },
    extraReducers: (builder) => {
        builder.addCase(changeBillingAddress, (state, { payload }) => {
            if (!state.value) {
                return;
            }

            state.value.CountryCode = payload.CountryCode;
            state.value.State = payload.State;
            state.value.ZipCode = payload.ZipCode;
        });
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectPaymentStatus);

const thunk = ({ api: apiOverride }: { api?: Api } = {}): ThunkAction<
    Promise<Model>,
    PaymentStatusState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument });
        };
        const cb = async () => {
            try {
                const api = apiOverride ?? extraArgument.api;

                dispatch(slice.actions.pending());
                const normalizedPaymentStatus = await getPaymentMethodStatus(api);
                dispatch(slice.actions.fulfilled(normalizedPaymentStatus));
                return normalizedPaymentStatus;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };

        return cacheHelper({
            store: promiseStore,
            select,
            cb,
            expiry: 1 * MINUTE,
        });
    };
};

export const paymentStatusReducer = { [name]: slice.reducer };
export const paymentStatusThunk = thunk;
