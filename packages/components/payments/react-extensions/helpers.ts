import type { PaymentProcessorType } from './interface';

export function isChargebeePaymentProcessor(type?: PaymentProcessorType): boolean {
    if (!type) {
        return false;
    }

    return type.includes('chargebee');
}
