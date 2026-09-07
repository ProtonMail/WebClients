import { PAYMENT_METHOD_TYPES } from '../constants';
import type { Currency, PaymentMethodType, PlainPaymentMethodType } from '../interface';

const supportedCurrenciesByMethod: Partial<Record<PlainPaymentMethodType, Currency[]>> = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: ['EUR'],
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: ['EUR'],
};

export const getMethodSupportedCurrencies = (type: PaymentMethodType | undefined): Currency[] | undefined =>
    supportedCurrenciesByMethod[type as PlainPaymentMethodType];

export const isCurrencyRestrictedMethod = (type: PaymentMethodType | undefined): boolean => {
    return getMethodSupportedCurrencies(type) !== undefined;
};

export const isCurrencySupportedByMethod = (type: PaymentMethodType | undefined, currency: Currency): boolean => {
    const supportedCurrencies = getMethodSupportedCurrencies(type);
    return !supportedCurrencies || supportedCurrencies.includes(currency);
};

export const getIsCurrencyOverriden = ({
    currentCurrency,
    currencyBeforeOverride,
}: {
    currentCurrency: Currency;
    currencyBeforeOverride: Currency | undefined;
}) => !!currencyBeforeOverride && currentCurrency !== currencyBeforeOverride;

export const updateCurrencyOverride = ({
    currentCurrency,
    currencyBeforeOverride,
    currentSelectedMethod,
    newSelectedMethod,
}: {
    currentCurrency: Currency;
    currencyBeforeOverride: Currency | undefined;
    currentSelectedMethod: PaymentMethodType | undefined;
    newSelectedMethod?: PaymentMethodType;
}):
    | {
          currency: Currency;
          currencyBeforeOverride: Currency | undefined;
      }
    | undefined => {
    const supportedCurrencies = getMethodSupportedCurrencies(newSelectedMethod ?? currentSelectedMethod);

    const shouldOverrideCurrency = !!supportedCurrencies && !supportedCurrencies.includes(currentCurrency);

    // Switching away from a restricted method to one that supports the pre-override currency.
    const shouldChangeCurrencyBack =
        getIsCurrencyOverriden({ currentCurrency, currencyBeforeOverride }) &&
        isCurrencyRestrictedMethod(currentSelectedMethod) &&
        !!newSelectedMethod &&
        !!currencyBeforeOverride &&
        (getMethodSupportedCurrencies(newSelectedMethod)?.includes(currencyBeforeOverride) ?? true);

    if (shouldOverrideCurrency) {
        return {
            currency: supportedCurrencies[0],
            currencyBeforeOverride: currentCurrency,
        };
    }

    if (shouldChangeCurrencyBack && currencyBeforeOverride) {
        return {
            currency: currencyBeforeOverride,
            currencyBeforeOverride: undefined,
        };
    }
};
