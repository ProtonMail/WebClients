import { useCallback } from 'react';

import {
    NEW_BATCH_CURRENCIES_FEATURE_FLAG,
    getAvailableCurrencies,
    getPreferredCurrency,
} from '@proton/payments/core/currencies';
import { useGetFlag } from '@proton/unleash/useGetFlag';

export type GetPreferredCurrencyParamsHook = Omit<
    Parameters<typeof getPreferredCurrency>[0],
    'enableNewBatchCurrencies'
>;

type GetAvailableCurrenciesParamsHook = Omit<Parameters<typeof getAvailableCurrencies>[0], 'enableNewBatchCurrencies'>;

const getIsNewBatchCurrenciesEnabled = (getFlag: ReturnType<typeof useGetFlag>) => {
    return NEW_BATCH_CURRENCIES_FEATURE_FLAG ? getFlag(NEW_BATCH_CURRENCIES_FEATURE_FLAG) : true;
};

/**
 * @deprecated use '@proton/payments-ui/ui/hooks/useCurrencies instead'
 *
 * ````
 * import { useCurrencies} from '@proton/payments-ui/ui/hooks/useCurrencies'
 * ````
 */
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
