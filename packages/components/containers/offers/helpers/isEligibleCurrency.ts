import type { Currency } from '@proton/payments';

const eligibleCurrencies = new Set<Currency>([
    'USD',
    'CHF',
    'EUR',
    'AUD',
    'CAD',
    'GBP',
    'BRL',
    'PLN',
    'SGD',
    'KRW',
    'HKD',
    'JPY',
]);

export function isEligibleCurrency(currency: Currency) {
    return eligibleCurrencies.has(currency);
}
