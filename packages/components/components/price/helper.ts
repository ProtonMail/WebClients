import { CurrencySymbols } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

/**
 * Make amount readable
 * 600 -> 6, 650 -> 6.50, 633 -> 6.33
 */
export const humanPrice = (amount: number = 0, divisor: number = 100) => {
    const fixedValue = Number(amount / divisor).toFixed(2);
    return fixedValue.replace('.00', '').replace('-', '');
};

export const getSimplePriceString = (currency: Currency, rawPrice: number, suffix: string = '') => {
    const price = humanPrice(rawPrice, 100);
    const isNegative = rawPrice < 0;
    const optionalNegative = isNegative ? '-' : '';

    if (currency === 'EUR') {
        return `${optionalNegative}${price} ${CurrencySymbols.EUR}${suffix}`;
    }
    if (currency === 'USD') {
        return `${optionalNegative}${CurrencySymbols.USD}${price}${suffix}`;
    }

    return `${optionalNegative}${currency} ${price}${suffix}`;
};
