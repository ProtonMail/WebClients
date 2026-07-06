import type { Maybe } from '@proton/pass/types';
import { getDefaultMainCurrency } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';

export const supportedCurrencies = ['USD', 'EUR', 'CHF'];

export const getUserCurrency = (currency: Maybe<Currency>) =>
    currency && supportedCurrencies.includes(currency) ? currency : getDefaultMainCurrency();
