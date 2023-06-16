import { ChargeablePaymentParameters, PaymentProcessor } from '../core';

export interface PaymentProcessorHook {
    fetchPaymentToken: () => Promise<unknown>;
    fetchingToken: boolean;
    verifyPaymentToken: () => Promise<ChargeablePaymentParameters>;
    verifyingToken: boolean;
    paymentProcessor?: PaymentProcessor;
    processPaymentToken: () => Promise<ChargeablePaymentParameters>;
    processingToken: boolean;
    meta: {
        type: 'paypal' | 'paypal-credit' | 'card' | 'saved';
        data?: any;
    };
}
