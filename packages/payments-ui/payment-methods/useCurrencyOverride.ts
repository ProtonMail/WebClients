import { useState } from 'react';

import type {
    AvailablePaymentMethod,
    Currency,
    PaymentMethodType,
    PlainPaymentMethodType,
} from '@proton/payments/core/interface';
import {
    getIsCurrencyOverriden,
    isCurrencyRestrictedMethod,
    updateCurrencyOverride,
} from '@proton/payments/core/payment-methods/currencyOverride';

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
