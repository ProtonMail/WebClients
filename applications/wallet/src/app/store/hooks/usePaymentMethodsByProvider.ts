import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { WasmFiatCurrencySymbol } from '@proton/andromeda';
import { baseUseSelector } from '@proton/redux-shared-store';
import { createHooks } from '@proton/redux-utilities';

import {
    PaymentMethodsByProvider,
    paymentMethodsByProviderThunk,
    selectPaymentMethodsByProvider,
} from '../slices/paymentMethodByProvider';

const hooks = createHooks(paymentMethodsByProviderThunk, selectPaymentMethodsByProvider);

export const useGetPaymentMethodsByProvider = () => {
    const get = hooks.useGet();
    return useCallback(
        async (fiat: WasmFiatCurrencySymbol) => {
            const results = await get({ thunkArg: fiat });
            return results[fiat];
        },
        [get]
    );
};

export const usePaymentMethodsByProvider = (fiat: WasmFiatCurrencySymbol) => {
    const getPaymentMethodsByProvider = useGetPaymentMethodsByProvider();

    const paymentMethodsByProvider = createSelector(
        selectPaymentMethodsByProvider,
        (result): [PaymentMethodsByProvider | undefined, boolean] => {
            const { error, value } = result;

            const rate = value?.[fiat];
            const loading = rate === undefined && error === undefined;

            return [rate, loading];
        }
    );

    useEffect(() => {
        void getPaymentMethodsByProvider(fiat);
    }, [fiat, getPaymentMethodsByProvider]);

    return baseUseSelector(paymentMethodsByProvider);
};
