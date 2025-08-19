import { type Currency, CurrencySymbols } from '@proton/payments';

/**
 * Make amount readable
 * 600 -> 6, 650 -> 6.50, 633 -> 6.33
 */
export const humanPrice = (amount: number = 0, divisor: number = 100) => {
    const fixedValue = Number(amount / divisor).toFixed(2);
    return fixedValue.replace('.00', '').replace('-', '');
};

export function isCurrencyWithSpace(currency: Currency | string) {
    const currenciesWithoutSpace = ['USD', 'GBP', 'AUD', 'CAD'];
    return !currenciesWithoutSpace.includes(currency);
}

export const getSimplePriceString = (currency: Currency, rawPrice: number, suffix: string = '') => {
    const price = humanPrice(rawPrice, 100);
    const isNegative = rawPrice < 0;
    const optionalNegative = isNegative ? '-' : '';

    if (currency === 'EUR') {
        return `${optionalNegative}${price}\u00A0${CurrencySymbols.EUR}${suffix}`;
    }
    if (!isCurrencyWithSpace(currency)) {
        return `${optionalNegative}${CurrencySymbols[currency]}${price}${suffix}`;
    }

    return `${optionalNegative}${currency}\u00A0${price}${suffix}`;
};
