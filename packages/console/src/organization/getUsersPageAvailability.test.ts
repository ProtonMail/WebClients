import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getUsersPageAvailability } from './getUsersPageAvailability';

const setUpWithKeys = { RequiresKey: 1, HasKeys: 1 };
const setUpWithoutKeys = { RequiresKey: 0, Name: 'Organization' };
const notSetUp = { RequiresKey: 1, HasKeys: 0 };

const getOrganization = (overrides: Partial<OrganizationExtended> = {}) =>
    ({ State: ORGANIZATION_STATE.ACTIVE, UsedMembers: 1, ...setUpWithKeys, ...overrides }) as OrganizationExtended;

const getAvailability = ({
    organization = getOrganization(),
    plans = [PLANS.MAIL_PRO],
    canReadUsers = true,
}: {
    organization?: OrganizationExtended;
    plans?: CataloguedPlan[];
    canReadUsers?: boolean;
}) =>
    getUsersPageAvailability({
        organization,
        entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans, organization }),
        permissions: { 'account.user.read': canReadUsers },
    }).users;

describe('getUsersPageAvailability', () => {
    it('shows the page to an active, set up organization on a multi-user plan', () => {
        expect(getAvailability({})).toBe(true);
        expect(getAvailability({ organization: getOrganization(setUpWithoutKeys) })).toBe(true);
    });

    it('hides the page without account.user.read', () => {
        expect(getAvailability({ canReadUsers: false })).toBe(false);
    });

    it('hides the page from an organization that is not set up', () => {
        expect(getAvailability({ organization: getOrganization(notSetUp) })).toBe(false);
        expect(
            getUsersPageAvailability({
                organization: undefined,
                entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: [PLANS.MAIL_PRO] }),
                permissions: { 'account.user.read': true },
            }).users
        ).toBe(false);
    });

    it('hides the page on a plan without multiple users', () => {
        expect(getAvailability({ plans: [PLANS.MAIL] })).toBe(false);
    });

    it('keeps the page for a delinquent organization with sub users, so it can delete them', () => {
        const delinquent = { State: ORGANIZATION_STATE.DELINQUENT };

        expect(getAvailability({ organization: getOrganization({ ...delinquent, UsedMembers: 2 }) })).toBe(true);
        expect(getAvailability({ organization: getOrganization({ ...delinquent, UsedMembers: 1 }) })).toBe(false);
    });
});
