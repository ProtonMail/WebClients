import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrantsForTesting';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getPassOrganizationAccess, getPassPageAvailability } from './getPassOrganizationAccess';

const getAccess = (subscriptionPlans: CataloguedPlan[], { isSubsidiary = false } = {}) => {
    const organization = { IsSubsidiary: isSubsidiary } as OrganizationExtended;
    const entitlements = buildOrgAndUserEntitlementChecks({ subscriptionPlans, organization });

    return getPassOrganizationAccess({ organization, entitlements });
};

describe('getPassOrganizationAccess', () => {
    it.each([
        {
            name: 'Pass Professional',
            plans: [PLANS.PASS_BUSINESS],
            expected: { hasPassB2B: true, isPolicyUpgradeRequired: false },
        },
        {
            name: 'Pass Essentials',
            plans: [PLANS.PASS_PRO],
            expected: { hasPassB2B: true, isPolicyUpgradeRequired: true },
        },
        {
            name: 'a B2B organization without Pass',
            plans: [PLANS.VPN_BUSINESS],
            expected: { hasPassB2B: false, isPolicyUpgradeRequired: false },
        },
        {
            name: 'a free user',
            plans: [],
            expected: { hasPassB2B: false, isPolicyUpgradeRequired: true },
        },
    ] satisfies { name: string; plans: CataloguedPlan[]; expected: ReturnType<typeof getPassOrganizationAccess> }[])(
        'returns $expected for $name',
        ({ plans, expected }) => {
            expect(getAccess(plans)).toEqual(expected);
        }
    );

    it('treats an MSP subsidiary with no Pass entitlements as Pass B2B with no upgrade', () => {
        expect(getAccess([], { isSubsidiary: true })).toEqual({ hasPassB2B: true, isPolicyUpgradeRequired: false });
    });

    it('treats an MSP subsidiary with the organization policy entitlement as Pass B2B with no upgrade', () => {
        expect(getAccess([PLANS.PASS_BUSINESS], { isSubsidiary: true })).toEqual({
            hasPassB2B: true,
            isPolicyUpgradeRequired: false,
        });
    });
});

describe('getPassPageAvailability', () => {
    const allPermissions = { 'pass.policy.read': true, 'pass.report.read': true };
    const organizationWithKeys = { Name: 'Org', RequiresKey: 1, HasKeys: 1 } as OrganizationExtended;

    const getAvailability = ({
        plans = [PLANS.PASS_BUSINESS],
        organization = organizationWithKeys,
        permissions = allPermissions,
    }: {
        plans?: CataloguedPlan[];
        organization?: OrganizationExtended;
        permissions?: typeof allPermissions;
    } = {}) => {
        const entitlements = buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans, organization });

        return getPassPageAvailability({ organization, entitlements, permissions });
    };

    it('shows both pages to a Pass B2B organization with keys and both permissions', () => {
        expect(getAvailability()).toEqual({ policies: true, reports: true });
    });

    it('shows both pages to a Pass B2B organization set up without keys', () => {
        const organization = { Name: 'Org', RequiresKey: 0, HasKeys: 0 } as OrganizationExtended;

        expect(getAvailability({ organization })).toEqual({ policies: true, reports: true });
    });

    it('hides both pages from an organization that requires keys but has none', () => {
        const organization = { Name: 'Org', RequiresKey: 1, HasKeys: 0 } as OrganizationExtended;

        expect(getAvailability({ organization })).toEqual({ policies: false, reports: false });
    });

    it('hides both pages without an organization', () => {
        const entitlements = buildOrgAndUserEntitlementChecks({ subscriptionPlans: [PLANS.PASS_BUSINESS] });

        expect(getPassPageAvailability({ organization: undefined, entitlements, permissions: allPermissions })).toEqual(
            { policies: false, reports: false }
        );
    });

    it('hides both pages from a B2B organization without Pass', () => {
        expect(getAvailability({ plans: [PLANS.VPN_BUSINESS] })).toEqual({ policies: false, reports: false });
    });

    it('hides Policies without pass.policy.read', () => {
        expect(getAvailability({ permissions: { ...allPermissions, 'pass.policy.read': false } })).toEqual({
            policies: false,
            reports: true,
        });
    });

    it('hides Reports without pass.report.read', () => {
        expect(getAvailability({ permissions: { ...allPermissions, 'pass.report.read': false } })).toEqual({
            policies: true,
            reports: false,
        });
    });

    it.each([
        { name: 'no Pass entitlements', plans: [] },
        { name: 'the organization policy entitlement', plans: [PLANS.PASS_BUSINESS] },
    ] satisfies { name: string; plans: CataloguedPlan[] }[])(
        'shows both pages to an MSP subsidiary with $name',
        ({ plans }) => {
            const organization = { ...organizationWithKeys, IsSubsidiary: true } as OrganizationExtended;

            expect(getAvailability({ plans, organization })).toEqual({ policies: true, reports: true });
        }
    );
});
