import { PAYMENT_METHOD_TYPES } from '../constants';
import type { PaymentVendorStates, PlainPaymentMethodType } from '../interface';

export type PaymentSystem = 'chargebee' | 'inhouse';

/**
 * Telemetry-friendly name. Changing one of these changes what the data team receives.
 */
export type TelemetryMethodName =
    'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'sepa' | 'ideal' | 'bitcoin' | 'cash' | 'token';

export type PaymentMethodConfig = {
    /** Whether the system can keep this method on file for subsequent payments. */
    savable: boolean;
    telemetryName: TelemetryMethodName;
    /** The backend switch that says whether this method is offered at all. Absent when there is none. */
    vendorStateKey?: keyof PaymentVendorStates;
};

/**
 * One row per payment method. This is the single source of truth for method metadata: the savable,
 * telemetry and system lookups all derive from it, so a new method is described in one place.
 *
 * Availability rules stay in ./paymentMethodAvailability — they need the full checkout context.
 */
export const paymentMethodRegistry = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: {
        savable: true,
        telemetryName: 'card',
        vendorStateKey: 'Card',
    },
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: {
        savable: true,
        telemetryName: 'paypal',
        vendorStateKey: 'Paypal',
    },
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: {
        savable: true,
        telemetryName: 'sepa',
        vendorStateKey: 'Card',
    },
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: {
        savable: true,
        telemetryName: 'ideal',
        vendorStateKey: 'Ideal',
    },
    [PAYMENT_METHOD_TYPES.APPLE_PAY]: {
        savable: true,
        telemetryName: 'apple_pay',
        vendorStateKey: 'Apple',
    },
    [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: {
        savable: true,
        telemetryName: 'google_pay',
        vendorStateKey: 'Google',
    },
    // in-house QR code and polling, it never goes through the Chargebee iframe
    [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: {
        savable: false,
        telemetryName: 'bitcoin',
        vendorStateKey: 'Bitcoin',
    },
    [PAYMENT_METHOD_TYPES.CASH]: {
        savable: false,
        telemetryName: 'cash',
        vendorStateKey: 'Cash',
    },
    [PAYMENT_METHOD_TYPES.TOKEN]: {
        savable: false,
        telemetryName: 'token',
    },
} as const satisfies Record<PAYMENT_METHOD_TYPES, PaymentMethodConfig>;

export const getPaymentMethodConfig = (type: PlainPaymentMethodType): PaymentMethodConfig | undefined =>
    paymentMethodRegistry[type];
