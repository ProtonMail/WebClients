import { renderHook } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrants';
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

const mockEntitlements = (subscriptionPlans: CataloguedPlan[], organizationPlans?: CataloguedPlan[]) => {
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, organizationPlans }),
        false,
    ]);
};

const consumerCases = [
    { name: 'a free user', subscriptionPlans: [], organizationPlans: undefined },
    { name: 'a Mail Plus user', subscriptionPlans: [PLANS.MAIL], organizationPlans: undefined },
    { name: 'a Family admin', subscriptionPlans: [PLANS.FAMILY], organizationPlans: undefined },
    { name: 'a Family member', subscriptionPlans: [], organizationPlans: [PLANS.FAMILY] },
] as const;

const businessCases = [
    { name: 'a Mail Professional admin', subscriptionPlans: [PLANS.MAIL_PRO], organizationPlans: undefined },
    { name: 'a VPN Business admin', subscriptionPlans: [PLANS.VPN_BUSINESS], organizationPlans: undefined },
    {
        name: 'a user with Mail Plus and VPN Business',
        subscriptionPlans: [PLANS.MAIL, PLANS.VPN_BUSINESS],
        organizationPlans: undefined,
    },
    { name: 'a member of a VPN Essentials organization', subscriptionPlans: [], organizationPlans: [PLANS.VPN_PRO] },
] as const;

beforeEach(() => {
    jest.mocked(useFlag).mockReturnValue(true);
    jest.mocked(useVariant).mockReturnValue({ name: 'B', enabled: true });
});

describe('useShowDashboard', () => {
    it.each(consumerCases)('shows the Mail dashboard to $name', ({ subscriptionPlans, organizationPlans }) => {
        mockEntitlements([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        expect(renderHook(() => useShowDashboard(APPS.PROTONMAIL)).result.current.showDashboard).toBe(true);
    });

    it.each(businessCases)('hides the Mail dashboard from $name', ({ subscriptionPlans, organizationPlans }) => {
        mockEntitlements([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        expect(renderHook(() => useShowDashboard(APPS.PROTONMAIL)).result.current.showDashboard).toBe(false);
    });

    it('hides the dashboard in apps without one', () => {
        mockEntitlements([PLANS.MAIL]);

        expect(renderHook(() => useShowDashboard(APPS.PROTONVPN_SETTINGS)).result.current.showDashboard).toBe(false);
    });
});

describe('useShowDriveDashboard', () => {
    it.each(consumerCases)('shows the Drive dashboard to $name', ({ subscriptionPlans, organizationPlans }) => {
        mockEntitlements([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        const { result } = renderHook(() => useShowDriveDashboard(APPS.PROTONDRIVE));

        expect(result.current.canShowDashboard).toBe(true);
        expect(result.current.showDashboard).toBe(true);
    });

    it.each(businessCases)('hides the Drive dashboard from $name', ({ subscriptionPlans, organizationPlans }) => {
        mockEntitlements([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        const { result } = renderHook(() => useShowDriveDashboard(APPS.PROTONDRIVE));

        expect(result.current.canShowDashboard).toBe(false);
        expect(result.current.showDashboard).toBe(false);
    });
});

describe('useShowGenericDashboard', () => {
    it.each(consumerCases)('shows the account dashboard to $name', ({ subscriptionPlans, organizationPlans }) => {
        mockEntitlements([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        expect(renderHook(() => useShowGenericDashboard(APPS.PROTONACCOUNT)).result.current).toBe(true);
    });

    it.each(businessCases)('hides the account dashboard from $name', ({ subscriptionPlans, organizationPlans }) => {
        mockEntitlements([...subscriptionPlans], organizationPlans && [...organizationPlans]);

        expect(renderHook(() => useShowGenericDashboard(APPS.PROTONACCOUNT)).result.current).toBe(false);
    });
});
