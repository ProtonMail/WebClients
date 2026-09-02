import { buildUser } from '@proton/account/testing/buildUser';
import { getOrganizationState } from '@proton/account/testing/redux-state';
import type { Address, OrganizationExtended, PendingInvitation, UserModel } from '@proton/shared/lib/interfaces';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

import type { Entitlements } from '../core/entitlements/interface';
import type { Plan } from '../core/plan/interface';
import { FREE_PLAN } from '../core/subscription/freePlans';
import type { Subscription } from '../core/subscription/interface';
import { getLongTestPlans } from './data-plans';
import { makeEntitlements } from './makeEntitlements';
import { getSubscriptionState } from './redux-state';

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
        entitlements: {
            value: entitlements ?? makeEntitlements(),
            error: undefined,
            meta: { fetchedAt: Date.now(), fetchedEphemeral: true as const },
        },
        plans: {
            value: { plans, freePlan: FREE_PLAN },
            error: undefined,
            meta: { fetchedAt: Date.now(), fetchedEphemeral: true as const },
        },
    };
};
