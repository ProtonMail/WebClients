import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getOrganizationKeysPageAvailability } from './getOrganizationKeysPageAvailability';

const withKeys = { RequiresKey: 1, HasKeys: 1 };
const family = { PlanName: PLANS.FAMILY, RequiresKey: 0, HasKeys: 0, Name: 'Family' };

const getOrganization = (overrides: Partial<OrganizationExtended> = {}) =>
    ({
        State: ORGANIZATION_STATE.ACTIVE,
        PlanName: PLANS.MAIL_PRO,
        Name: 'Organization',
        ...withKeys,
        ...overrides,
    }) as OrganizationExtended;

const allPermissions = { 'account.organization_identity.read': true };

const getAvailability = ({
    organization = getOrganization(),
    plans = [PLANS.MAIL_PRO],
    permissions = allPermissions,
}: {
    organization?: OrganizationExtended;
    plans?: CataloguedPlan[];
    permissions?: typeof allPermissions;
}) =>
    getOrganizationKeysPageAvailability({
        organization,
        entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans, organization }),
        permissions,
    });

describe('getOrganizationKeysPageAvailability', () => {
    describe('organizationKeys', () => {
        it('shows the page to an active organization with keys', () => {
            expect(getAvailability({}).organizationKeys).toBe(true);
        });

        it('hides the page without account.organization_identity.read', () => {
            expect(
                getAvailability({ permissions: { 'account.organization_identity.read': false } }).organizationKeys
            ).toBe(false);
        });

        it('hides the page without an organization', () => {
            expect(
                getOrganizationKeysPageAvailability({
                    organization: undefined,
                    entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: [] }),
                    permissions: allPermissions,
                }).organizationKeys
            ).toBe(false);
        });

        it('hides the page from an organization that requires keys and has none yet', () => {
            expect(getAvailability({ organization: getOrganization({ HasKeys: 0 }) }).organizationKeys).toBe(false);
        });

        it('hides the page from an organization that does not require keys', () => {
            const organization = getOrganization({ RequiresKey: 0, HasKeys: 0 });
            expect(getAvailability({ organization }).organizationKeys).toBe(false);
        });

        it('hides the page from a delinquent organization', () => {
            const organization = getOrganization({ State: ORGANIZATION_STATE.DELINQUENT });
            expect(getAvailability({ organization }).organizationKeys).toBe(false);
        });

        it('shows the page to an active, named family', () => {
            expect(
                getAvailability({ organization: getOrganization(family), plans: [PLANS.FAMILY] }).organizationKeys
            ).toBe(true);
        });

        it('hides the page from a family without a name', () => {
            const organization = getOrganization({ ...family, Name: '' });
            expect(getAvailability({ organization, plans: [PLANS.FAMILY] }).organizationKeys).toBe(false);
        });
    });

    describe('passwordKeys', () => {
        it('shows the key section to a multi-user organization with an active key', () => {
            expect(getAvailability({}).passwordKeys).toBe(true);
        });

        it('hides the key section without the multi-user entitlement', () => {
            expect(getAvailability({ plans: [PLANS.MAIL] }).passwordKeys).toBe(false);
        });

        it('hides the key section from an organization without keys', () => {
            expect(getAvailability({ organization: getOrganization({ HasKeys: 0 }) }).passwordKeys).toBe(false);
        });

        it('hides the key section from a delinquent organization', () => {
            const organization = getOrganization({ State: ORGANIZATION_STATE.DELINQUENT });
            expect(getAvailability({ organization }).passwordKeys).toBe(false);
        });
    });
});
