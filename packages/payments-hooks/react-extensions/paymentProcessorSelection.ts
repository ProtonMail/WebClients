import type { AvailablePaymentMethod, PlainPaymentMethodType } from '@proton/payments/core/interface';
import { getPaymentMethodConfig } from '@proton/payments/core/payment-methods/registry';
import { isExistingPaymentMethod } from '@proton/payments/core/type-guards';

export const isSavedChargebeeMethodType = (type: AvailablePaymentMethod['type']): boolean => {
    const config = getPaymentMethodConfig(type);
    return config?.system === 'chargebee' && config.savable;
};

export const selectPaymentProcessor = <TSaved, TNewProcessors extends Record<PlainPaymentMethodType, unknown>>(
    selectedMethod: AvailablePaymentMethod | undefined,
    savedProcessor: TSaved,
    newMethodProcessors: TNewProcessors
): TSaved | TNewProcessors[PlainPaymentMethodType] | undefined => {
    if (!selectedMethod) {
        return undefined;
    }

    if (isExistingPaymentMethod(selectedMethod.value)) {
        return isSavedChargebeeMethodType(selectedMethod.type) ? savedProcessor : undefined;
    }

    return newMethodProcessors[selectedMethod.type];
};

export const resetPaymentProcessors = (
    savedProcessor: { reset: () => void },
    newMethodProcessors: Record<PlainPaymentMethodType, { reset: () => void } | undefined>
) => {
    [savedProcessor, ...Object.values(newMethodProcessors)].forEach((processor) => processor?.reset());
};
