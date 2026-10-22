import { renderHook } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { buildUser } from '@proton/account/testing/buildUser';
import { useUser } from '@proton/account/user/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrants';
import { USER_ROLES } from '@proton/shared/lib/constants';

import useIsB2BAdmin from './useIsB2BAdmin';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

const renderIsB2BAdmin = ({
    role = USER_ROLES.ADMIN_ROLE,
    subscriptionPlans,
    organizationPlans,
}: {
    role?: USER_ROLES;
    subscriptionPlans: CataloguedPlan[];
    organizationPlans?: CataloguedPlan[];
}) => {
    jest.mocked(useUser).mockReturnValue([buildUser({ Role: role }), false]);
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, organizationPlans }),
        false,
    ]);
    return renderHook(() => useIsB2BAdmin()).result.current;
};

describe('useIsB2BAdmin', () => {
    it.each([
        { subscriptionPlans: [PLANS.MAIL_PRO], expected: true },
        { subscriptionPlans: [PLANS.VPN_BUSINESS], expected: true },
        { subscriptionPlans: [PLANS.PASS_PRO], expected: true },
        { subscriptionPlans: [PLANS.MAIL], expected: false },
        { subscriptionPlans: [PLANS.FAMILY], expected: false },
        { subscriptionPlans: [], expected: false },
    ] as const)('is $expected for an admin with $subscriptionPlans', ({ subscriptionPlans, expected }) => {
        expect(renderIsB2BAdmin({ subscriptionPlans: [...subscriptionPlans] })).toBe(expected);
    });

    it('is true when one of several subscriptions is business', () => {
        expect(renderIsB2BAdmin({ subscriptionPlans: [PLANS.MAIL, PLANS.VPN_BUSINESS] })).toBe(true);
    });

    it('is true for an admin who cannot read the subscriptions of a business organization', () => {
        expect(renderIsB2BAdmin({ subscriptionPlans: [], organizationPlans: [PLANS.PASS_BUSINESS] })).toBe(true);
    });

    it('is false for a member of a business organization', () => {
        expect(
            renderIsB2BAdmin({
                role: USER_ROLES.MEMBER_ROLE,
                subscriptionPlans: [],
                organizationPlans: [PLANS.MAIL_PRO],
            })
        ).toBe(false);
    });
});
