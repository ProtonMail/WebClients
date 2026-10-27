import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrants';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { UserType } from '@proton/shared/lib/interfaces/User';

import { getCanSeeBYOE } from './byoeAccess';

const adminUser = { Role: USER_ROLES.ADMIN_ROLE, Type: UserType.PROTON } as unknown as UserModel;
const memberUser = { Role: USER_ROLES.MEMBER_ROLE, Type: UserType.PROTON } as unknown as UserModel;
const managedAdminUser = { Role: USER_ROLES.ADMIN_ROLE, Type: UserType.MANAGED } as unknown as UserModel;
const managedMemberUser = { Role: USER_ROLES.MEMBER_ROLE, Type: UserType.MANAGED } as unknown as UserModel;

const entitlementsForAdmin = (subscriptionPlans: CataloguedPlan[]) =>
    buildOrgAndUserEntitlementChecks({ subscriptionPlans });

const entitlementsForMember = (subscriptionPlans: CataloguedPlan[]) =>
    buildOrgAndUserEntitlementChecks({ subscriptionPlans, ...organizationMember });

describe('getCanSeeBYOE', () => {
    describe('B2B plans', () => {
        it.each([PLANS.BUNDLE_PRO_2024, PLANS.VPN_BUSINESS, PLANS.PASS_PRO] as const)('allows admins of %s', (plan) => {
            expect(getCanSeeBYOE({ user: adminUser, entitlements: entitlementsForAdmin([plan]) })).toBe(true);
        });

        it.each([PLANS.BUNDLE_PRO_2024, PLANS.VPN_BUSINESS, PLANS.PASS_PRO] as const)(
            'blocks non-admins of %s',
            (plan) => {
                expect(getCanSeeBYOE({ user: memberUser, entitlements: entitlementsForMember([plan]) })).toBe(false);
            }
        );

        it('allows an admin whose B2B plan is one of several subscriptions', () => {
            expect(
                getCanSeeBYOE({ user: adminUser, entitlements: entitlementsForAdmin([PLANS.MAIL, PLANS.VPN_BUSINESS]) })
            ).toBe(true);
        });
    });

    describe('managed users (Visionary/Duo)', () => {
        it('allows managed admins', () => {
            expect(
                getCanSeeBYOE({ user: managedAdminUser, entitlements: entitlementsForAdmin([PLANS.VISIONARY]) })
            ).toBe(true);
        });

        it('blocks managed non-admins', () => {
            expect(
                getCanSeeBYOE({ user: managedMemberUser, entitlements: entitlementsForMember([PLANS.VISIONARY]) })
            ).toBe(false);
        });
    });

    describe('regular users', () => {
        it.each([PLANS.MAIL, PLANS.FAMILY, PLANS.VISIONARY] as const)('allows users with %s', (plan) => {
            expect(getCanSeeBYOE({ user: memberUser, entitlements: entitlementsForMember([plan]) })).toBe(true);
        });

        it('allows users without a subscription', () => {
            expect(getCanSeeBYOE({ user: memberUser, entitlements: entitlementsForAdmin([]) })).toBe(true);
        });
    });
});
