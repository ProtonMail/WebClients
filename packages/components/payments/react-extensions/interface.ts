import { PaymentProcessor } from '../core';

export interface PaymentProcessorHook {
    fetchPaymentToken: () => Promise<unknown>;
    fetchingToken: boolean;
    verifyPaymentToken: () => Promise<unknown>;
    verifyingToken: boolean;
    paymentProcessor?: PaymentProcessor;
    processPaymentToken: () => Promise<unknown>;
    processingToken: boolean;
    meta: {
        type:
            | 'paypal'
            | 'paypal-credit'
            | 'card'
            | 'saved'
            | 'chargebee-card'
            | 'chargebee-paypal'
            | 'chargebee-paypal-credit'
            | 'saved-chargebee';
        data?: any;
    };
}
