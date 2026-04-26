import {
    type BillingAddressExtended,
    type FullBillingAddress,
    getBillingAddressStatus,
} from '../../core/billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from '../../core/billing-address/billing-address-from-payments-status';
import type { GetFullBillingAddressOptions, PaymentStatus } from '../../core/interface';

export async function loadInitialBillingAddress({
    getPaymentStatus,
    getFullBillingAddress,
    isAuthenticated,
}: {
    getPaymentStatus: () => Promise<PaymentStatus>;
    getFullBillingAddress: (options: GetFullBillingAddressOptions) => Promise<FullBillingAddress>;
    isAuthenticated: boolean;
}): Promise<{ billingAddress: BillingAddressExtended; paymentStatus: PaymentStatus }> {
    const paymentStatus = await getPaymentStatus();

    const shouldRestoreZipCode = !isAuthenticated;
    const billingAddressFromPaymentStatus = getBillingAddressFromPaymentStatus(paymentStatus, {
        shouldRestoreZipCode,
    });
    const billingAddressStatus = getBillingAddressStatus(billingAddressFromPaymentStatus);

    // valid billing address from payment status can happen when:
    // 1. existing user already has valid billing address. In that case, payment status and billing-information will
    //    have the same CountryCode, State, ZipCode returned by the backend.
    // 2. New user without previously saved billing address. They don't have billing-information yet, so the only
    //    available data is from payment status. If it returns valid CountryCode, State, ZipCode, we can use it.
    //
    // Please note that if function input shouldRestoreZipCode is true then the billing address will be restored with
    // the ZIP code, and the billing address will be valid.
    if (billingAddressStatus.valid) {
        return {
            billingAddress: billingAddressFromPaymentStatus,
            paymentStatus,
        };
    }

    const restoredResult = {
        billingAddress: getBillingAddressFromPaymentStatus(paymentStatus, { shouldRestoreZipCode: true }),
        paymentStatus,
    };

    if (shouldRestoreZipCode) {
        return restoredResult;
    }

    // Invalid billing address from payment status can happen when:
    // 1. Existing user somehow has saved invalid billing address.
    // 2. New user without previously saved billing address. Payment status detects CountryCode, State, or ZipCode
    //    wrongly.
    //
    // But at the same time, we don't know if payment status returns saved or detected billing address. It means that we
    //    need to load billing-information to see what's actually saved.

    // If billing-information has no billing address, then we need to use payment status, and restore the missing
    // fields.
    const fullBillingAddress = await getFullBillingAddress({ withFallback: false });
    if (!fullBillingAddress.BillingAddress) {
        return restoredResult;
    }

    // If billing-information has billing address, the user previously saved it, then we can't restore anything and we
    // have to use what's available
    return {
        billingAddress: fullBillingAddress.BillingAddress,
        paymentStatus,
    };
}
