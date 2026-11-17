import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getActivityMonitorPageAvailability } from './getActivityMonitorPageAvailability';

const setUpWithKeys = { RequiresKey: 1, HasKeys: 1 };
const setUpWithoutKeys = { RequiresKey: 0, Name: 'Organization' };
const notSetUp = { RequiresKey: 1, HasKeys: 0 };

const getOrganization = (overrides: Partial<OrganizationExtended> = {}) =>
    ({ State: ORGANIZATION_STATE.ACTIVE, ...setUpWithKeys, ...overrides }) as OrganizationExtended;

const getAvailability = ({
    organization = getOrganization(),
    plans = [],
    canReadActivityLog = true,
}: {
    organization?: OrganizationExtended;
    plans?: CataloguedPlan[];
    canReadActivityLog?: boolean;
}) =>
    getActivityMonitorPageAvailability({
        organization,
        entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans, organization }),
        permissions: { 'account.activity_log.read': canReadActivityLog },
    }).activityMonitor;

describe('getActivityMonitorPageAvailability', () => {
    it('shows the page to a set up organization', () => {
        expect(getAvailability({})).toBe(true);
        expect(getAvailability({ organization: getOrganization(setUpWithoutKeys) })).toBe(true);
    });

    it('shows the page to a B2B plan whose organization is not set up yet', () => {
        expect(getAvailability({ organization: getOrganization(notSetUp), plans: [PLANS.MAIL_PRO] })).toBe(true);
    });

    it('hides the page from a consumer plan without an organization set up', () => {
        expect(getAvailability({ organization: getOrganization(notSetUp), plans: [PLANS.MAIL] })).toBe(false);
    });

    it('hides the page without account.activity_log.read', () => {
        expect(getAvailability({ canReadActivityLog: false })).toBe(false);
    });
});
