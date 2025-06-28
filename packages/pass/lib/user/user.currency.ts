import type { Maybe } from '@proton/pass/types';
import { type Currency, DEFAULT_CURRENCY } from '@proton/payments';

export const supportedCurrencies = ['USD', 'EUR', 'CHF'];

export const getUserCurrency = (currency: Maybe<Currency>) =>
    currency && supportedCurrencies.includes(currency) ? currency : DEFAULT_CURRENCY;
