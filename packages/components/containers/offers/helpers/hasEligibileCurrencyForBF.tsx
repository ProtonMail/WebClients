import type { Currency } from '@proton/payments';

const eligibleCurrencies = new Set<Currency>(['CHF', 'EUR', 'USD', 'AUD', 'CAD', 'GBP', 'BRL']);

const hasEligibileCurrencyForBF = (currency: Currency) => {
    return eligibleCurrencies.has(currency);
};

export default hasEligibileCurrencyForBF;
