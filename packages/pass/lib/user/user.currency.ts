import type { Maybe } from '@proton/pass/types';
import { DEFAULT_CURRENCY } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';

export const supportedCurrencies = ['USD', 'EUR', 'CHF'];

export const getUserCurrency = (currency: Maybe<Currency>) =>
    currency && supportedCurrencies.includes(currency) ? currency : DEFAULT_CURRENCY;
