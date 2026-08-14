import { useState } from 'react';

import { PAYMENT_METHOD_TYPES } from '../constants';
import type { AvailablePaymentMethod, Currency, PaymentMethodType, PlainPaymentMethodType } from '../interface';

export const getMethodSupportedCurrencies = (type: PaymentMethodType | undefined): Currency[] | undefined => {
    switch (type) {
        case PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT:
            return ['EUR'];
        case PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL:
            return ['EUR'];
        default:
            return undefined;
    }
};

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

export const useCurrencyOverride = ({
    currentCurrency,
    currentSelectedMethodType,
    methods,
}: {
    currentCurrency: Currency;
    currentSelectedMethodType: PlainPaymentMethodType | undefined;
    methods: AvailablePaymentMethod[];
}) => {
    const [currencyBeforeOverride, setCurrencyBeforeOverride] = useState<Currency | undefined>(undefined);

    return {
        isCurrencyOverriden: getIsCurrencyOverriden({ currentCurrency, currencyBeforeOverride }),
        updateCurrencyOverride: (newPaymentMethodValue: PaymentMethodType | undefined) => {
            if (!newPaymentMethodValue) {
                return;
            }

            const newPaymentType = methods.find((method) => method.value === newPaymentMethodValue)?.type;
            const selectedRestrictedMethod = isCurrencyRestrictedMethod(newPaymentType);
            const unselectedRestrictedMethod =
                isCurrencyRestrictedMethod(currentSelectedMethodType) && newPaymentType !== currentSelectedMethodType;

            if (!selectedRestrictedMethod && !unselectedRestrictedMethod) {
                return;
            }

            const result = updateCurrencyOverride({
                currentCurrency,
                currencyBeforeOverride,
                currentSelectedMethod: currentSelectedMethodType,
                newSelectedMethod: newPaymentType,
            });

            if (!result) {
                return;
            }

            setCurrencyBeforeOverride(result.currencyBeforeOverride);

            return result.currency;
        },
    };
};
