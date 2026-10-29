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

import useShowVPNDashboard from './useShowVPNDashboard';

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

const renderShowVPNDashboard = ({ subscriptionPlans, viewer }: EntitlementsCase) => {
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans: [...subscriptionPlans], ...viewer }),
        false,
    ]);
    return renderHook(() => useShowVPNDashboard(APPS.PROTONVPN_SETTINGS)).result.current;
};

beforeEach(() => {
    jest.mocked(useFlag).mockReturnValue(true);
    jest.mocked(useVariant).mockReturnValue({ name: 'B', enabled: true });
});

describe('useShowVPNDashboard', () => {
    it.each([
        { name: 'a free user', subscriptionPlans: [] },
        { name: 'a Family admin', subscriptionPlans: [PLANS.FAMILY] },
        { name: 'a Family member', subscriptionPlans: [PLANS.FAMILY], viewer: organizationMember },
    ] as const)('shows the VPN dashboard to $name', (testCase) => {
        const result = renderShowVPNDashboard(testCase);

        expect(result.canShowVPNDashboard).toBe(true);
        expect(result.showVPNDashboard).toBe(true);
    });

    it.each([
        { name: 'a VPN Essentials admin', subscriptionPlans: [PLANS.VPN_PRO] },
        { name: 'a Mail Professional admin', subscriptionPlans: [PLANS.MAIL_PRO] },
        {
            name: 'a user with Family and VPN Business',
            subscriptionPlans: [PLANS.FAMILY, PLANS.VPN_BUSINESS],
        },
        {
            name: 'a member of a VPN Business organization',
            subscriptionPlans: [PLANS.VPN_BUSINESS],
            viewer: organizationMember,
        },
    ] as const)('hides the VPN dashboard from $name', (testCase) => {
        const result = renderShowVPNDashboard(testCase);

        expect(result.canShowVPNDashboard).toBe(false);
        expect(result.showVPNDashboard).toBe(false);
    });

    it('hides the VPN dashboard in the control variant', () => {
        jest.mocked(useVariant).mockReturnValue({ name: 'Control', enabled: true });

        const result = renderShowVPNDashboard({ subscriptionPlans: [PLANS.FAMILY] });

        expect(result.canShowVPNDashboard).toBe(true);
        expect(result.showVPNDashboard).toBe(false);
    });
});
