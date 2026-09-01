import { DEFAULT_TAX_BILLING_ADDRESS } from '../core/billing-address/billing-address';
import { DEFAULT_PAYMENT_VENDOR_STATES } from '../core/constants';
import type { PaymentStatus } from '../core/interface';
import type { Subscription } from '../core/subscription/interface';

export const getSubscriptionState = (value: Subscription = {} as Subscription) => {
    return {
        meta: {
            type: 1,
            fetchedAt: Date.now(),
            fetchedEphemeral: true,
        },
        value,
        error: undefined,
    };
};

export const getPaymentStatusState = (
    value: PaymentStatus = {
        VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
        ...DEFAULT_TAX_BILLING_ADDRESS,
    }
) => {
    return {
        meta: {
            fetchedAt: Date.now(),
            fetchedEphemeral: true,
        },
        value,
        error: undefined,
    };
};
