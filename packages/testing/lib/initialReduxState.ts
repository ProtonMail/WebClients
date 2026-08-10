import type { OrganizationState, PaymentStatusState, SubscriptionState } from '@proton/account';
import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments/core/billing-address/billing-address';
import { DEFAULT_PAYMENT_VENDOR_STATES } from '@proton/payments/core/constants';
import type { PaymentStatus } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

export const getSubscriptionState = (value: Subscription = {} as any): SubscriptionState['subscription'] => {
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

export const getOrganizationState = (value: OrganizationExtended = {} as any): OrganizationState['organization'] => {
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
): PaymentStatusState['paymentStatus'] => {
    return {
        meta: {
            fetchedAt: Date.now(),
            fetchedEphemeral: true,
        },
        value,
        error: undefined,
    };
};
