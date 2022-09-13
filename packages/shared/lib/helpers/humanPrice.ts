import { Currency } from '../interfaces';

/**
 * Make amount readable
 * 600 -> 6, 650 -> 6.50, 633 -> 6.33
 */
const humanPrice = (amount: number = 0, divisor: number = 100) => {
    const fixedValue = Number(amount / divisor).toFixed(2);
    return fixedValue.replace('.00', '').replace('-', '');
};

export default humanPrice;

export const humanPriceWithCurrency = (amount: number, currency: Currency, divisor?: number) => {
    if (typeof amount !== 'number' || typeof currency !== 'string') {
        throw new Error('humanPriceWithCurrency: Invalid parameters');
    }

    const value = humanPrice(amount, divisor);
    const isNegative = amount < 0;
    const prefix = isNegative ? '-' : '';

    if (currency === 'EUR') {
        return `${prefix}${value} €`;
    }

    if (currency === 'CHF') {
        return `${prefix}CHF ${value}`;
    }

    if (currency === 'USD') {
        return `${prefix}$${value}`;
    }

    return `${prefix}${value}`;
};
