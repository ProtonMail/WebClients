import { getNaiveCurrencyRate } from './currencies';
import type { Currency } from './interface';

export function getMinCreditAmount(currency: Currency): number {
    const minUsdAmount = 500;
    const rate = getNaiveCurrencyRate(currency);
    return minUsdAmount * rate;
}

export function getMaxCreditAmount(currency: Currency): number {
    const maxUsdAmount = 4000000;
    const rate = getNaiveCurrencyRate(currency);
    return maxUsdAmount * rate;
}

export function getMinBitcoinAmount(currency: Currency): number {
    const minUsdAmount = 499;
    const rate = getNaiveCurrencyRate(currency);
    return minUsdAmount * rate;
}

export function getMaxBitcoinAmount(currency: Currency): number {
    return getMaxCreditAmount(currency);
}

export function getMinPaypalAmountInhouse(currency: Currency): number {
    const minUsdAmount = 499;
    const rate = getNaiveCurrencyRate(currency);
    return minUsdAmount * rate;
}

export function getMinPaypalAmountChargebee(currency: Currency): number {
    const minUsdAmount = 100;
    const rate = getNaiveCurrencyRate(currency);
    return minUsdAmount * rate;
}

export function getMinApplePayAmount(currency: Currency): number {
    const minUsdAmount = 100;
    const rate = getNaiveCurrencyRate(currency);
    return minUsdAmount * rate;
}

export function getMinGooglePayAmount(currency: Currency): number {
    const minUsdAmount = 100;
    const rate = getNaiveCurrencyRate(currency);
    return minUsdAmount * rate;
}
