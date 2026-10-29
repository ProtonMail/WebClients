import { renderHook } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { PLANS } from '@proton/payments/core/constants';
import type { UserAndOrganizationForSubscriptions } from '@proton/payments/core/entitlements/unreadable-subscriptions';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

import useShowDashboard, { useShowDriveDashboard, useShowGenericDashboard } from './useShowDashboard';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));

jest.mock('@proton/unleash/useFlag', () => ({
    useFlag: jest.fn(),
}));

jest.mock('@proton/unleash/useVariant', () => ({
    useVariant: jest.fn(),
}));

type EntitlementsCase = {
    subscriptionPlans: readonly CataloguedPlan[];
    viewer?: UserAndOrganizationForSubscriptions;
};

const mockEntitlements = ({ subscriptionPlans, viewer }: EntitlementsCase) => {
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans: [...subscriptionPlans], ...viewer }),
        false,
    ]);
};

const consumerCases = [
    { name: 'a free user', subscriptionPlans: [] },
    { name: 'a Mail Plus user', subscriptionPlans: [PLANS.MAIL] },
    { name: 'a Family admin', subscriptionPlans: [PLANS.FAMILY] },
    { name: 'a Family member', subscriptionPlans: [PLANS.FAMILY], viewer: organizationMember },
] as const;

const businessCases = [
    { name: 'a Mail Professional admin', subscriptionPlans: [PLANS.MAIL_PRO] },
    { name: 'a VPN Business admin', subscriptionPlans: [PLANS.VPN_BUSINESS] },
    {
        name: 'a user with Mail Plus and VPN Business',
        subscriptionPlans: [PLANS.MAIL, PLANS.VPN_BUSINESS],
    },
    {
        name: 'a member of a VPN Essentials organization',
        subscriptionPlans: [PLANS.VPN_PRO],
        viewer: organizationMember,
    },
] as const;

beforeEach(() => {
    jest.mocked(useFlag).mockReturnValue(true);
    jest.mocked(useVariant).mockReturnValue({ name: 'B', enabled: true });
});

describe('useShowDashboard', () => {
    it.each(consumerCases)('shows the Mail dashboard to $name', (testCase) => {
        mockEntitlements(testCase);

        expect(renderHook(() => useShowDashboard(APPS.PROTONMAIL)).result.current.showDashboard).toBe(true);
    });

    it.each(businessCases)('hides the Mail dashboard from $name', (testCase) => {
        mockEntitlements(testCase);

        expect(renderHook(() => useShowDashboard(APPS.PROTONMAIL)).result.current.showDashboard).toBe(false);
    });

    it('hides the dashboard in apps without one', () => {
        mockEntitlements({ subscriptionPlans: [PLANS.MAIL] });

        expect(renderHook(() => useShowDashboard(APPS.PROTONVPN_SETTINGS)).result.current.showDashboard).toBe(false);
    });
});

describe('useShowDriveDashboard', () => {
    it.each(consumerCases)('shows the Drive dashboard to $name', (testCase) => {
        mockEntitlements(testCase);

        const { result } = renderHook(() => useShowDriveDashboard(APPS.PROTONDRIVE));

        expect(result.current.canShowDashboard).toBe(true);
        expect(result.current.showDashboard).toBe(true);
    });

    it.each(businessCases)('hides the Drive dashboard from $name', (testCase) => {
        mockEntitlements(testCase);

        const { result } = renderHook(() => useShowDriveDashboard(APPS.PROTONDRIVE));

        expect(result.current.canShowDashboard).toBe(false);
        expect(result.current.showDashboard).toBe(false);
    });
});

describe('useShowGenericDashboard', () => {
    it.each(consumerCases)('shows the account dashboard to $name', (testCase) => {
        mockEntitlements(testCase);

        expect(renderHook(() => useShowGenericDashboard(APPS.PROTONACCOUNT)).result.current).toBe(true);
    });

    it.each(businessCases)('hides the account dashboard from $name', (testCase) => {
        mockEntitlements(testCase);

        expect(renderHook(() => useShowGenericDashboard(APPS.PROTONACCOUNT)).result.current).toBe(false);
    });
});
