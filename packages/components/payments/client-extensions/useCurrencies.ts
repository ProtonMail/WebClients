import { useCallback } from 'react';

import { getAvailableCurrencies, getPreferredCurrency } from '@proton/payments';
import { NEW_BATCH_CURRENCIES_FEATURE_FLAG } from '@proton/payments';
import { useGetFlag } from '@proton/unleash';

export type GetPreferredCurrencyParamsHook = Omit<
    Parameters<typeof getPreferredCurrency>[0],
    'enableNewBatchCurrencies'
>;

export type GetAvailableCurrenciesParamsHook = Omit<
    Parameters<typeof getAvailableCurrencies>[0],
    'enableNewBatchCurrencies'
>;

export const getIsNewBatchCurrenciesEnabled = (getFlag: ReturnType<typeof useGetFlag>) => {
    return NEW_BATCH_CURRENCIES_FEATURE_FLAG ? getFlag(NEW_BATCH_CURRENCIES_FEATURE_FLAG) : true;
};

export const useCurrencies = () => {
    const getFlag = useGetFlag();

    return {
        getPreferredCurrency: useCallback(
            (params: GetPreferredCurrencyParamsHook) =>
                getPreferredCurrency({
                    ...params,
                    enableNewBatchCurrencies: getIsNewBatchCurrenciesEnabled(getFlag),
                }),
            []
        ),

        getAvailableCurrencies: useCallback(
            (params: GetAvailableCurrenciesParamsHook) =>
                getAvailableCurrencies({
                    ...params,
                    enableNewBatchCurrencies: getIsNewBatchCurrenciesEnabled(getFlag),
                }),
            []
        ),
    };
};
