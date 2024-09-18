import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities';

import type { GetQuotesArgs, QuotesByProvider } from '../slices/quotesByProvider';
import { getQuotesByProviderKey, quotesByProviderThunk, selectQuotesByProvider } from '../slices/quotesByProvider';

const hooks = createHooks(quotesByProviderThunk, selectQuotesByProvider);

export const useGetQuotesByProvider = () => {
    const get = hooks.useGet();
    return useCallback(
        async (args: GetQuotesArgs) => {
            const key = getQuotesByProviderKey(args);
            const results = await get({ thunkArg: args });

            return results[key];
        },
        [get]
    );
};

export const useQuotesByProvider = (args: GetQuotesArgs) => {
    const getQuotesByProvider = useGetQuotesByProvider();

    const key = getQuotesByProviderKey(args);

    const paymentMethodsByProvider = createSelector(
        selectQuotesByProvider,
        (result): [QuotesByProvider | undefined, boolean] => {
            const { error, value } = result;

            const rate = value?.[key];
            const loading = rate === undefined && error === undefined;

            return [rate, loading];
        }
    );

    useEffect(() => {
        void getQuotesByProvider(args);
    }, [args, getQuotesByProvider]);

    return baseUseSelector(paymentMethodsByProvider);
};
