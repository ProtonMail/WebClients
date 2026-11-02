import { PAYMENT_METHOD_TYPES } from '../constants';
import type { Currency, PaymentMethodType, PlainPaymentMethodType } from '../interface';

const supportedCurrenciesByMethod: Partial<Record<PlainPaymentMethodType, Currency[]>> = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: ['EUR'],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: ['EUR'],
};

export const isCurrencySupportedByMethod = (type: PaymentMethodType | undefined, currency: Currency): boolean => {
    const supportedCurrencies = supportedCurrenciesByMethod[type as PlainPaymentMethodType];
    return !supportedCurrencies || supportedCurrencies.includes(currency);
};
