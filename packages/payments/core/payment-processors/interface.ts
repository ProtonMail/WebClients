import { type PAYMENT_METHOD_TYPES } from '../constants';
import { type PaymentProcessor } from './paymentProcessor';

export type PaymentProcessorType =
    | 'paypal'
    | 'paypal-credit'
    | 'card'
    | 'saved'
    | 'chargebee-card'
    | 'chargebee-paypal'
    | 'chargebee-paypal-credit'
    | 'saved-chargebee'
    | 'bitcoin'
    | 'chargebee-bitcoin'
    | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
    | PAYMENT_METHOD_TYPES.APPLE_PAY;

export function getSystemByHookType(
    type: PaymentProcessorType | 'n/a' | undefined
): 'chargebee' | 'inhouse' | 'n/a' | undefined {
    switch (type) {
        case 'paypal':
        case 'paypal-credit':
        case 'card':
        case 'saved':
        case 'bitcoin':
            return 'inhouse';

        case 'chargebee-card':
        case 'chargebee-paypal':
        case 'chargebee-paypal-credit':
        case 'saved-chargebee':
            return 'chargebee';

        case 'n/a':
            return 'n/a';

        case undefined:
            return undefined;
    }
}

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
