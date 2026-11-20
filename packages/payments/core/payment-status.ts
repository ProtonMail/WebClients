import { DEFAULT_TAX_BILLING_ADDRESS } from './billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from './billing-address/billing-address-from-payments-status';
import type { PaymentStatus } from './interface';

export function normalizePaymentMethodStatus(status: PaymentStatus): PaymentStatus {
    // Do not restore ZIP code when payment status is simply loaded. This must be decided on level of components.
    const normalized: PaymentStatus = {
        ...status,
        ...getBillingAddressFromPaymentStatus(status, { shouldRestoreZipCode: false }),
    };

    const keys = Object.keys(normalized.VendorStates) as (keyof PaymentStatus['VendorStates'])[];

    // Normalizing the boolean values, converting them from 0 or 1 to false or true
    for (const key of keys) {
        normalized.VendorStates[key] = !!normalized.VendorStates[key];
    }

    // The backend doesn't return the Cash key. We still use it in the frontend,
    // so we synthetize it here.
    if (!Object.hasOwn(normalized.VendorStates, 'Cash')) {
        normalized.VendorStates.Cash = true;
    }

    return normalized;
}

/**
 * What a payment form shows until the payment status loads: card, Google Pay and PayPal are usually active. A page
 * that offers other methods can guess them active too, so they don't pop in.
 */
export const getOptimisticPaymentStatus = (vendorStates?: Partial<PaymentStatus['VendorStates']>): PaymentStatus => ({
    VendorStates: {
        Google: true,
        Card: true,
        Paypal: true,
        Apple: false,
        Cash: false,
        Bitcoin: false,
        Ideal: false,
        ...vendorStates,
    },
    CountryCode: DEFAULT_TAX_BILLING_ADDRESS.CountryCode,
    State: DEFAULT_TAX_BILLING_ADDRESS.State,
    ZipCode: DEFAULT_TAX_BILLING_ADDRESS.ZipCode,
});
