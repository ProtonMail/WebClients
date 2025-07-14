import {
    type PayloadAction,
    type ThunkAction,
    type UnknownAction,
    createAction,
    createSlice,
    miniSerializeError,
} from '@reduxjs/toolkit';

import {
    type PaymentMethodStatusExtended,
    getPaymentMethodStatus,
    normalizePaymentMethodStatus,
} from '@proton/payments';
import { type ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import { type Api } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import { type ModelState } from '../interface';

const name = 'paymentStatus' as const;

export interface PaymentStatusState {
    [name]: ModelState<PaymentMethodStatusExtended>;
}

type SliceState = PaymentStatusState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPaymentStatus = (state: PaymentStatusState) => state.paymentStatus;

export const changeBillingAddress = createAction<Pick<PaymentMethodStatusExtended, 'CountryCode' | 'State'>>(
    'paymentStatus/changeBillingAddress'
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
        },
    },
    extraReducers: (builder) => {
        builder.addCase(changeBillingAddress, (state, { payload }) => {
            if (!state.value) {
                return;
            }

            state.value.CountryCode = payload.CountryCode;
            state.value.State = payload.State;
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
                const value = await getPaymentMethodStatus(api);
                const normalizedPaymentStatus = normalizePaymentMethodStatus(value);
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
