import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import { type PaymentsInit, getPaymentsInit } from '@proton/payments/core/api/api';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { previousSelector } from '@proton/redux-utilities/creator';
import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities/fetchedAt';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import type { CacheType } from '@proton/redux-utilities/interface';
import { cacheHelper, createPromiseStore } from '@proton/redux-utilities/promiseStore';
import { DAY } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

const name = 'paymentsInit' as const;

export const POSTED_INVOICE_BANNER_MAX_AGE = 25 * DAY;

export const POSTED_INVOICE_BANNER_STORAGE_KEY = 'posted-invoice-top-banner';

export interface PaymentsInitInvoice {
    id: string;
    /** Unix timestamp in milliseconds */
    createTime: number;
    /** Unix timestamp in milliseconds */
    dueTime?: number;
}

export interface PaymentsInitData {
    hasPostedInvoices: boolean;
    postedInvoices: PaymentsInitInvoice[];
    userCode?: number;
}

export interface PaymentsInitState {
    [name]: ModelState<PaymentsInitData>;
}

type SliceState = PaymentsInitState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPaymentsInit = (state: PaymentsInitState) => state.paymentsInit;

const normalizePaymentsInit = (result: PaymentsInit): PaymentsInitData => {
    const postedInvoices = (result.User?.PostedInvoices ?? [])
        .toSorted(({ CreateTime: a }, { CreateTime: b }) => a - b)
        .map(({ ID, CreateTime, DueTime }) => ({
            id: ID,
            createTime: CreateTime * 1000,
            dueTime: DueTime ? DueTime * 1000 : undefined,
        }));

    return {
        hasPostedInvoices: postedInvoices.length > 0,
        postedInvoices,
        userCode: result.User?.Code,
    };
};

const fetchPaymentsInit = async (api: Api): Promise<PaymentsInitData> => {
    const result = await api<PaymentsInit>(getPaymentsInit());
    return normalizePaymentsInit(result);
};

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {
        fulfilled: (state, action: PayloadAction<Model>) => {
            state.value = action.payload;
            state.error = undefined;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
    },
});

const promiseStore = createPromiseStore<Model>();
const previous = previousSelector(selectPaymentsInit);

const thunk = ({
    api: apiOverride,
    cache,
}: {
    api?: Api;
    cache?: CacheType;
} = {}): ThunkAction<Promise<Model>, PaymentsInitState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options: { cache } });
        };
        const cb = async () => {
            try {
                const api = apiOverride ?? extraArgument.api;

                const paymentsInit = await fetchPaymentsInit(api);
                dispatch(slice.actions.fulfilled(paymentsInit));
                return paymentsInit;
            } catch {
                // Failures are not surfaced: payments init is best-effort, callers get empty data instead of an error.
                const fallback: PaymentsInitData = { hasPostedInvoices: false, postedInvoices: [] };
                dispatch(slice.actions.fulfilled(fallback));
                return fallback;
            }
        };

        return cacheHelper({
            store: promiseStore,
            select,
            cb,
            cache,
            expiry: POSTED_INVOICE_BANNER_MAX_AGE,
        });
    };
};

export const paymentsInitReducer = { [name]: slice.reducer };
export const paymentsInitThunk = thunk;
