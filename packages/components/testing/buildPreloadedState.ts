import { getOrganizationState } from '@proton/account/testing/redux-state';
import type { Entitlements } from '@proton/payments/core/entitlements/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import { getEntitlementsState, getSubscriptionState } from '@proton/payments/testing/redux-state';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { PendingInvitation } from '@proton/shared/lib/interfaces/PendingInvitation';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { buildUser } from '@proton/shared/testing/buildUser';

export interface TestPreloadedStateOverrides {
    user?: Partial<UserModel>;
    subscription?: Subscription;
    organization?: OrganizationExtended;
    addresses?: Address[];
    calendars?: CalendarWithOwnMembers[];
    userInvitations?: PendingInvitation[];
    entitlements?: Entitlements;
    plans?: Plan[];
}

export const buildPreloadedState = (overrides: TestPreloadedStateOverrides = {}) => {
    const {
        user,
        subscription,
        organization,
        addresses = [],
        calendars = [],
        userInvitations = [],
        entitlements,
        plans = getLongTestPlans(),
    } = overrides;

    return {
        user: {
            value: { ...buildUser(), ...user },
            error: undefined,
            meta: { fetchedAt: Date.now(), fetchedEphemeral: true as const },
        },
        subscription: getSubscriptionState(subscription),
        organization: getOrganizationState(organization),
        addresses: {
            value: addresses,
            error: undefined,
            meta: { fetchedAt: Date.now(), fetchedEphemeral: true as const },
        },
        calendars: {
            value: calendars,
            error: undefined,
            meta: { fetchedAt: Date.now(), fetchedEphemeral: true as const },
        },
        userInvitations: {
            value: userInvitations,
            error: undefined,
            meta: { fetchedAt: Date.now(), fetchedEphemeral: true as const },
        },
        entitlements: getEntitlementsState(entitlements ?? makeEntitlements()),
        plans: {
            value: { plans, freePlan: FREE_PLAN },
            error: undefined,
            meta: { fetchedAt: Date.now(), fetchedEphemeral: true as const },
        },
    };
};
