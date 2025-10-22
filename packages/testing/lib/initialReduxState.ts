import type { OrganizationState, PaymentStatusState, SubscriptionState } from '@proton/account';
import { DEFAULT_TAX_BILLING_ADDRESS, type PaymentStatus, type Subscription } from '@proton/payments';
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
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
        },
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
