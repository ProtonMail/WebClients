import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrants';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { isOrganizationOLESEligible, isUserOLESEligible } from './eligibility';

const baseOrganization: Partial<Organization> = {
    RequiresKey: 1,
    HasKeys: 1,
    State: ORGANIZATION_STATE.ACTIVE,
    MaxMembers: 1,
};

const baseUser: Partial<UserModel> = {
    isAdmin: true,
    isSelf: true,
};

const entitlementsForAdmin = (subscriptionPlans: CataloguedPlan[]) =>
    buildOrgAndUserEntitlementChecks({ subscriptionPlans });

const eligibleArgs = () => ({
    user: baseUser as UserModel,
    organization: baseOrganization as Organization,
    entitlements: entitlementsForAdmin([PLANS.BUNDLE_PRO_2024]),
    hasOrgMigrationPermission: true,
});

describe('isUserOLESEligible', () => {
    it('returns true when all conditions are met', () => {
        expect(isUserOLESEligible(eligibleArgs())).toBe(true);
    });

    it('returns false when organization is undefined', () => {
        expect(isUserOLESEligible({ ...eligibleArgs(), organization: undefined })).toBe(false);
    });

    it('returns false when user is undefined', () => {
        expect(isUserOLESEligible({ ...eligibleArgs(), user: undefined })).toBe(false);
    });

    it('returns false when user lacks the organization migration permission', () => {
        expect(isUserOLESEligible({ ...eligibleArgs(), hasOrgMigrationPermission: false })).toBe(false);
    });

    it('returns false when user is not self', () => {
        expect(isUserOLESEligible({ ...eligibleArgs(), user: { ...baseUser, isSelf: false } as UserModel })).toBe(
            false
        );
    });

    it('returns false when organization has no keys (RequiresKey unset)', () => {
        expect(
            isUserOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, RequiresKey: 0 } as Organization,
            })
        ).toBe(false);
    });

    it('returns false when organization keys have not been generated (HasKeys unset)', () => {
        expect(
            isUserOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, HasKeys: 0 } as Organization,
            })
        ).toBe(false);
    });

    it('returns false when organization is delinquent', () => {
        expect(
            isUserOLESEligible({
                ...eligibleArgs(),
                organization: { ...baseOrganization, State: ORGANIZATION_STATE.DELINQUENT } as Organization,
            })
        ).toBe(false);
    });

    it('returns false without a subscription', () => {
        expect(isUserOLESEligible({ ...eligibleArgs(), entitlements: entitlementsForAdmin([]) })).toBe(false);
    });
});

describe('isOrganizationOLESEligible', () => {
    const organization = baseOrganization as Organization;

    it.each([PLANS.MAIL_PRO, PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025] as const)(
        'returns true for an admin of %s',
        (plan) => {
            expect(
                isOrganizationOLESEligible({
                    organization,
                    entitlements: entitlementsForAdmin([plan]),
                })
            ).toBe(true);
        }
    );

    it.each([PLANS.MAIL, PLANS.VPN_BUSINESS, PLANS.PASS_BUSINESS] as const)(
        'returns false for an admin of %s',
        (plan) => {
            expect(
                isOrganizationOLESEligible({
                    organization,
                    entitlements: entitlementsForAdmin([plan]),
                })
            ).toBe(false);
        }
    );

    it('returns true for a non-admin member of a bundlepro2024 organization', () => {
        const entitlements = buildOrgAndUserEntitlementChecks({
            subscriptionPlans: [PLANS.BUNDLE_PRO_2024],
            ...organizationMember,
        });

        expect(isOrganizationOLESEligible({ organization, entitlements })).toBe(true);
    });

    it('returns false for an admin with mail2022 and vpnbiz2023 as separate subscriptions', () => {
        expect(
            isOrganizationOLESEligible({
                organization,
                entitlements: entitlementsForAdmin([PLANS.MAIL, PLANS.VPN_BUSINESS]),
            })
        ).toBe(false);
    });
});
