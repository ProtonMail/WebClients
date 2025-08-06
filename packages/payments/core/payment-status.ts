import { getBillingAddressFromPaymentsStatus } from './billing-address/billing-address-from-payments-status';
import { type PaymentMethodStatusExtended } from './interface';

export function normalizePaymentMethodStatus(status: PaymentMethodStatusExtended): PaymentMethodStatusExtended {
    const normalized = getBillingAddressFromPaymentsStatus(status) as PaymentMethodStatusExtended;

    const keys = Object.keys(normalized.VendorStates) as (keyof PaymentMethodStatusExtended['VendorStates'])[];

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
