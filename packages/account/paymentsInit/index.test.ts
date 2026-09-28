import { configureStore } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import { paymentsInitReducer, paymentsInitThunk, selectPaymentsInit } from './index';

const setupStore = (api: jest.Mock) =>
    configureStore({
        reducer: paymentsInitReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: { api } as unknown as ProtonThunkArguments },
            }),
    });

describe('paymentsInitThunk', () => {
    it('should fetch and cache payments init data', async () => {
        const api = jest.fn().mockResolvedValue({
            User: {
                Code: 1000,
                PostedInvoices: [{ ID: 'invoice-1', CreateTime: 1700001000, DueTime: 1700004000 }],
            },
        });

        const store = setupStore(api);
        await store.dispatch(paymentsInitThunk());

        expect(api).toHaveBeenCalledTimes(1);
        expect(selectPaymentsInit(store.getState()).value).toEqual({
            hasPostedInvoices: true,
            postedInvoices: [{ id: 'invoice-1', createTime: 1700001000 * 1000, dueTime: 1700004000 * 1000 }],
            userCode: 1000,
        });

        await store.dispatch(paymentsInitThunk());
        expect(api).toHaveBeenCalledTimes(1);
    });

    it('should resolve with fallback data instead of throwing when the fetch fails', async () => {
        const api = jest.fn().mockRejectedValue(new Error('network down'));

        const store = setupStore(api);

        await expect(store.dispatch(paymentsInitThunk())).resolves.toEqual({
            hasPostedInvoices: false,
            postedInvoices: [],
        });

        const state = selectPaymentsInit(store.getState());
        expect(state.value).toEqual({ hasPostedInvoices: false, postedInvoices: [] });
        expect(state.error).toBeUndefined();
    });
});
