import type { PaymentProcessorType } from '@proton/payments';

export function isChargebeePaymentProcessor(type?: PaymentProcessorType): boolean {
    if (!type) {
        return false;
    }

    return type.includes('chargebee');
}
