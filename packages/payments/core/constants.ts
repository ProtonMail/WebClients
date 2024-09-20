import type { PaymentMethodFlows } from './interface';

export enum PAYMENT_TOKEN_STATUS {
    STATUS_PENDING = 0,
    STATUS_CHARGEABLE = 1,
    STATUS_FAILED = 2,
    STATUS_CONSUMED = 3,
    STATUS_NOT_SUPPORTED = 4,
}

export enum PAYMENT_METHOD_TYPES {
    CARD = 'card',
    PAYPAL = 'paypal',
    PAYPAL_CREDIT = 'paypal-credit',
    BITCOIN = 'bitcoin',
    CHARGEBEE_BITCOIN = 'chargebee-bitcoin',
    CASH = 'cash',
    TOKEN = 'token',
    CHARGEBEE_CARD = 'chargebee-card',
    CHARGEBEE_PAYPAL = 'chargebee-paypal',
}
export const signupFlows: readonly PaymentMethodFlows[] = Object.freeze([
    'signup',
    'signup-pass',
    'signup-pass-upgrade',
    'signup-vpn',
    'signup-v2',
    'signup-v2-upgrade',
]);
export enum Autopay {
    DISABLE = 0,
    ENABLE = 1,
}

export enum MethodStorage {
    INTERNAL = 0,
    EXTERNAL = 1,
}

export enum INVOICE_TYPE {
    OTHER = 0,
    SUBSCRIPTION = 1,
    CANCELLATION = 2,
    CREDIT = 3,
    DONATION = 4,
    CHARGEBACK = 5,
    RENEWAL = 6,
    REFUND = 7,
    MODIFICATION = 8,
    ADDITION = 9,
    CURRENCY_CONVERSION = 10,
}

export enum INVOICE_STATE {
    UNPAID = 0,
    PAID = 1,
    VOID = 2,
    BILLED = 3,
    WRITEOFF = 4,
}
