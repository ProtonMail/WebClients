import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getSecurityPageAvailability } from './getSecurityPageAvailability';

const setUpWithKeys = { RequiresKey: 1, HasKeys: 1 };
const setUpWithoutKeys = { RequiresKey: 0, Name: 'Organization' };
const notSetUp = { RequiresKey: 1, HasKeys: 0 };

const getOrganization = (overrides: Partial<OrganizationExtended> = {}) =>
    ({
        State: ORGANIZATION_STATE.ACTIVE,
        MaxMembers: 2,
        TwoFactorRequired: ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED,
        ...setUpWithKeys,
        ...overrides,
    }) as OrganizationExtended;

const allPermissions = { 'account.security_policy.read': true, 'account.activity_log.read': true };

const getAvailability = ({
    organization = getOrganization(),
    plans = [],
    permissions = allPermissions,
}: {
    organization?: OrganizationExtended;
    plans?: CataloguedPlan[];
    permissions?: typeof allPermissions;
}) =>
    getSecurityPageAvailability({
        organization,
        entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans, organization }),
        permissions,
    });

describe('getSecurityPageAvailability', () => {
    describe('security', () => {
        it('shows the page to an active, set-up organization with more than 1 seat', () => {
            expect(getAvailability({}).security).toBe(true);
        });

        it('shows the page to an organization set up without keys', () => {
            expect(getAvailability({ organization: getOrganization(setUpWithoutKeys) }).security).toBe(true);
        });

        it('shows the page to a 1-seat organization that requires 2FA', () => {
            const organization = getOrganization({
                MaxMembers: 1,
                TwoFactorRequired: ORGANIZATION_TWOFA_SETTING.REQUIRED_ADMIN_ONLY,
            });
            expect(getAvailability({ organization }).security).toBe(true);
        });

        it('hides the page from a 1-seat organization without 2FA required', () => {
            expect(getAvailability({ organization: getOrganization({ MaxMembers: 1 }) }).security).toBe(false);
        });

        it('hides the page without account.security_policy.read', () => {
            const permissions = { ...allPermissions, 'account.security_policy.read': false };
            expect(getAvailability({ permissions }).security).toBe(false);
        });

        it('hides the page from a delinquent organization', () => {
            const organization = getOrganization({ State: ORGANIZATION_STATE.DELINQUENT });
            expect(getAvailability({ organization }).security).toBe(false);
        });

        it('hides the page from an organization that is not set up', () => {
            expect(getAvailability({ organization: getOrganization(notSetUp) }).security).toBe(false);
        });

        it('hides the page without an organization', () => {
            expect(
                getSecurityPageAvailability({
                    organization: undefined,
                    entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: [] }),
                    permissions: allPermissions,
                }).security
            ).toBe(false);
        });
    });

    describe('sentinel', () => {
        it('shows Sentinel to a set-up organization', () => {
            expect(getAvailability({}).sentinel).toBe(true);
        });

        it('shows Sentinel to a delinquent, set-up organization', () => {
            const organization = getOrganization({ State: ORGANIZATION_STATE.DELINQUENT });
            expect(getAvailability({ organization }).sentinel).toBe(true);
        });

        it('shows Sentinel to a B2B organization that is not set up', () => {
            const organization = getOrganization(notSetUp);
            expect(getAvailability({ organization, plans: [PLANS.BUNDLE_BIZ_2025] }).sentinel).toBe(true);
        });

        it('hides Sentinel from an organization that is neither set up nor B2B', () => {
            expect(getAvailability({ organization: getOrganization(notSetUp) }).sentinel).toBe(false);
        });

        it('hides Sentinel without account.activity_log.read', () => {
            const permissions = { ...allPermissions, 'account.activity_log.read': false };
            expect(getAvailability({ permissions }).sentinel).toBe(false);
        });
    });
});
