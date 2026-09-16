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
 * Wraps `getPreferredCurrency` and `getAvailableCurrencies` from `@proton/payments/core/currencies`
 * with `enableNewBatchCurrencies` resolved from the Unleash flag.
 *
 * @example
 * const { getPreferredCurrency, getAvailableCurrencies } = useCurrencies();
 * const currency = getPreferredCurrency({ plans, subscription, user, paymentStatus });
 * const currencies = getAvailableCurrencies({ plans, paymentStatus, paramCurrency });
 */
export const useCurrencies = () => {
    const getFlag = useGetFlag();

    return {
        /**
         * Resolves the billing currency.
         *
         * @param params - See {@link GetPreferredCurrencyParamsHook}.
         * @returns The preferred currency, e.g. `'USD'`.
         */
        getPreferredCurrency: useCallback(
            (params: GetPreferredCurrencyParamsHook) =>
                getPreferredCurrency({
                    ...params,
                    enableNewBatchCurrencies: getIsNewBatchCurrenciesEnabled(getFlag),
                }),
            []
        ),

        /**
         * Resolves the selectable currencies for the checkout.
         *
         * @param params - See {@link GetAvailableCurrenciesParamsHook}.
         * @returns Main currencies (USD/EUR/CHF) plus supported regional currencies.
         */
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
