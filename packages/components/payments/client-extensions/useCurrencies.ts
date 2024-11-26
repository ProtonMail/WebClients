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

export const useCurrencies = () => {
    const getFlag = useGetFlag();

    const flag = () => (NEW_BATCH_CURRENCIES_FEATURE_FLAG ? getFlag(NEW_BATCH_CURRENCIES_FEATURE_FLAG) : true);

    return {
        getPreferredCurrency: (params: GetPreferredCurrencyParamsHook) =>
            getPreferredCurrency({
                ...params,
                enableNewBatchCurrencies: flag(),
            }),

        getAvailableCurrencies: (params: GetAvailableCurrenciesParamsHook) =>
            getAvailableCurrencies({
                ...params,
                enableNewBatchCurrencies: flag(),
            }),
    };
};
