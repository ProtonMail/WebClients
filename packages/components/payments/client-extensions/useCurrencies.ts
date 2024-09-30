import { getAvailableCurrencies, getPreferredCurrency } from '@proton/payments';

/**
 * Even though this hook does nothing at the moment, I'm still keeping it in case if I need to introduce the feature
 * flags again for release of other regional currencies
 */
export const useCurrencies = () => {
    return {
        getPreferredCurrency,
        getAvailableCurrencies,
    };
};
