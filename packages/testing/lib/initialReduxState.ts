import { OrganizationState, type SubscriptionState } from '@proton/account';
import type { OrganizationWithSettings, SubscriptionModel } from '@proton/shared/lib/interfaces';

export const getSubscriptionState = (value: SubscriptionModel = {} as any): SubscriptionState['subscription'] => {
    return {
        meta: {
            type: 1,
            fetchedAt: Date.now(),
        },
        value,
        error: undefined,
    };
};

export const getOrganizationState = (
    value: OrganizationWithSettings = {} as any
): OrganizationState['organization'] => {
    return {
        meta: {
            type: 1,
            fetchedAt: Date.now(),
        },
        value,
        error: undefined,
    };
};
