import { type Currency, CurrencySymbols } from '@proton/payments';
import {
    getCurrencyFormattingConfig,
    getCurrencyFormattingConfigWithoutFallback,
} from '@proton/payments/core/currencies';

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

export const defaultSymbolPosition = 'prefix-space' as const;

export function getSimplePriceString(currency: Currency, rawPrice: number, suffix: string = ''): string {
    const config = getCurrencyFormattingConfigWithoutFallback(currency);
    const symbolPosition = config?.symbolPosition ?? defaultSymbolPosition;

    const price = formatPriceWithoutCurrency(rawPrice, currency);
    const isNegative = rawPrice < 0;
    const optionalNegative = isNegative ? '-' : '';

    const currencySymbol = CurrencySymbols[currency] || currency;

    if (symbolPosition === 'suffix-space') {
        const suffixSpaceFormatting = `${optionalNegative}${price}\u00A0${currencySymbol}${suffix}`;
        return suffixSpaceFormatting;
    }

    if (symbolPosition === 'prefix-nospace') {
        const prefixNospaceFormatting = `${optionalNegative}${currencySymbol}${price}${suffix}`;
        return prefixNospaceFormatting;
    }

    const prefixSpaceFormatting = `${optionalNegative}${currencySymbol}\u00A0${price}${suffix}`;
    return prefixSpaceFormatting;
}
