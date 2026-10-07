import type { PAYMENT_METHOD_TYPES } from '../constants';
import { type PaymentSystem, getPaymentMethodConfig } from '../payment-methods/registry';
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
    | PAYMENT_METHOD_TYPES.GOOGLE_PAY
    | PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL;

/** Processor types that predate the registry and so have no PAYMENT_METHOD_TYPES counterpart. */
const systemByLegacyProcessor = {
    paypal: 'inhouse',
    card: 'inhouse',
    saved: 'inhouse',
    bitcoin: 'inhouse',
    'saved-chargebee': 'chargebee',
    'n/a': 'n/a',
} as const satisfies Partial<Record<PaymentProcessorType | 'n/a', PaymentSystem | 'n/a'>>;

export function getSystemByHookType(type: PaymentProcessorType | 'n/a' | undefined): PaymentSystem | 'n/a' | undefined {
    if (!type) {
        return undefined;
    }

    return (
        systemByLegacyProcessor[type as keyof typeof systemByLegacyProcessor] ??
        getPaymentMethodConfig(type as PAYMENT_METHOD_TYPES)?.system
    );
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
    userInitiatedProcessing: boolean;
    meta: {
        type: PaymentProcessorType;
        data?: any;
    };
}
