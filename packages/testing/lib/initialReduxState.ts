import type { OrganizationState } from '@proton/account';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

export { getPaymentStatusState, getSubscriptionState } from '@proton/payments/testing/redux-state';

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
