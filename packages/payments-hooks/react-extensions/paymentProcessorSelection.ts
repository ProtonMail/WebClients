import type { AvailablePaymentMethod, PlainPaymentMethodType } from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { isExistingPaymentMethod } from '@proton/payments/core/type-guards';

export const selectPaymentProcessor = (
    selectedMethod: AvailablePaymentMethod | undefined,
    savedProcessor: PaymentProcessorHook,
    newMethodProcessors: Record<PlainPaymentMethodType, PaymentProcessorHook | undefined>
): PaymentProcessorHook | undefined => {
    if (!selectedMethod) {
        return undefined;
    }

    if (isExistingPaymentMethod(selectedMethod.value)) {
        return savedProcessor;
    }

    return newMethodProcessors[selectedMethod.type];
};
