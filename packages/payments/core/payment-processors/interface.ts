import type { PAYMENT_METHOD_TYPES } from '../constants';
import type { PaymentProcessor } from './paymentProcessor';

export type PaymentProcessorType =
    | 'paypal'
    | 'card'
    | 'saved'
    | 'chargebee-card'
    | 'chargebee-paypal'
    | 'saved-chargebee'
    | 'bitcoin'
    | 'chargebee-bitcoin'
    | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
    | PAYMENT_METHOD_TYPES.APPLE_PAY
    | PAYMENT_METHOD_TYPES.GOOGLE_PAY;

export interface PaymentProcessorHook {
    fetchPaymentToken: () => Promise<unknown>;
    fetchingToken: boolean;
    verifyPaymentToken: () => Promise<unknown>;
    verifyingToken: boolean;
    paymentProcessor?: PaymentProcessor;
    processPaymentToken: () => Promise<unknown>;
    processingToken: boolean;
    reset: () => void;
    meta: {
        type: PaymentProcessorType;
        data?: any;
    };
}
