import type { Maybe } from '@proton/pass/types';
import { DEFAULT_CURRENCY } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';

export const getUserCurrency = (currency: Maybe<Currency>) =>
    currency && ['USD', 'EUR', 'CHF'].includes(currency) ? currency : DEFAULT_CURRENCY;
