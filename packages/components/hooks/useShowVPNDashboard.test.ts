import { renderHook } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrants';
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

const renderShowVPNDashboard = (subscriptionPlans: CataloguedPlan[], organizationPlans?: CataloguedPlan[]) => {
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, organizationPlans }),
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
        { name: 'a free user', subscriptionPlans: [], organizationPlans: undefined },
        { name: 'a Family admin', subscriptionPlans: [PLANS.FAMILY], organizationPlans: undefined },
        { name: 'a Family member', subscriptionPlans: [], organizationPlans: [PLANS.FAMILY] },
    ] as const)('shows the VPN dashboard to $name', ({ subscriptionPlans, organizationPlans }) => {
        const result = renderShowVPNDashboard([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        expect(result.canShowVPNDashboard).toBe(true);
        expect(result.showVPNDashboard).toBe(true);
    });

    it.each([
        { name: 'a VPN Essentials admin', subscriptionPlans: [PLANS.VPN_PRO], organizationPlans: undefined },
        { name: 'a Mail Professional admin', subscriptionPlans: [PLANS.MAIL_PRO], organizationPlans: undefined },
        {
            name: 'a user with Family and VPN Business',
            subscriptionPlans: [PLANS.FAMILY, PLANS.VPN_BUSINESS],
            organizationPlans: undefined,
        },
        {
            name: 'a member of a VPN Business organization',
            subscriptionPlans: [],
            organizationPlans: [PLANS.VPN_BUSINESS],
        },
    ] as const)('hides the VPN dashboard from $name', ({ subscriptionPlans, organizationPlans }) => {
        const result = renderShowVPNDashboard([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        expect(result.canShowVPNDashboard).toBe(false);
        expect(result.showVPNDashboard).toBe(false);
    });

    it('hides the VPN dashboard in the control variant', () => {
        jest.mocked(useVariant).mockReturnValue({ name: 'Control', enabled: true });

        const result = renderShowVPNDashboard([PLANS.FAMILY]);

        expect(result.canShowVPNDashboard).toBe(true);
        expect(result.showVPNDashboard).toBe(false);
    });
});
