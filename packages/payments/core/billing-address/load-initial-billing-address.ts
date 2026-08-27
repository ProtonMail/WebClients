import type { GetFullBillingAddressOptions, PaymentStatus } from '../interface';
import { type BillingAddressExtended, type FullBillingAddress, getBillingAddressStatus } from './billing-address';
import { getBillingAddressFromPaymentStatus } from './billing-address-from-payments-status';

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

    const fullBillingAddress = await getFullBillingAddress({ withFallback: false });
    if (!fullBillingAddress.BillingAddress) {
        return restoredResult;
    }

    return {
        billingAddress: fullBillingAddress.BillingAddress,
        paymentStatus,
    };
}
