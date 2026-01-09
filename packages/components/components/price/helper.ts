import { type Currency, CurrencySymbols } from '@proton/payments';
import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';

/**
 * Make amount readable
 * 600 -> 6, 650 -> 6.50, 633 -> 6.33.
 *
 * Avoid using this function directly. Prefer`getSimplePriceString` instead.
 */
export function formatPriceWithoutCurrency(amount: number, currency: Currency) {
    const { divisor } = getCurrencyFormattingConfig(currency);

    const fixedValue = Number(amount / divisor).toFixed(2);
    return fixedValue.replace('.00', '').replace('-', '');
}

export function getSimplePriceString(currency: Currency, rawPrice: number, suffix: string = '') {
    const { symbolPosition } = getCurrencyFormattingConfig(currency);

    const price = formatPriceWithoutCurrency(rawPrice, currency);
    const isNegative = rawPrice < 0;
    const optionalNegative = isNegative ? '-' : '';

    if (symbolPosition === 'suffix-space') {
        return `${optionalNegative}${price}\u00A0${CurrencySymbols[currency]}${suffix}`;
    }

    if (symbolPosition === 'prefix-nospace') {
        return `${optionalNegative}${CurrencySymbols[currency]}${price}${suffix}`;
    }

    const prefixSpaceFormatting = `${optionalNegative}${CurrencySymbols[currency]}\u00A0${price}${suffix}`;
    if (symbolPosition === 'prefix-space') {
        return prefixSpaceFormatting;
    }

    return prefixSpaceFormatting;
}
