import type { Currency } from '@proton/payments';

const eligibleCurrencies = new Set<Currency>(['CHF', 'EUR', 'USD', 'AUD', 'CAD', 'GBP', 'BRL']);
const eligibleCurrenciesForPassBF = eligibleCurrencies.difference(new Set(['BRL']));

const hasEligibileCurrencyForBF = (currency: Currency) => {
    return eligibleCurrencies.has(currency);
};

// special case for Pass BF
export const hasEligibileCurrencyForPassBF = (currency: Currency) => {
    return eligibleCurrenciesForPassBF.has(currency);
};

export default hasEligibileCurrencyForBF;
