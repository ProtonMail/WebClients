import { EMPTY_ORG_PERMISSIONS } from '@proton/account/userPermissions';
import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import { buildUser } from '@proton/shared/testing/buildUser';

import type { Flags, OrganizationRouterParams } from '../../content/router-params';
import { getMspAppRoutes } from './routes';

const buildParams = (overrides: Partial<OrganizationRouterParams>): OrganizationRouterParams => ({
    app: APPS.PROTONPASS,
    user: buildUser({ isAdmin: true }),
    subscription: {} as Subscription,
    allSubscriptions: [],
    entitlements: { isMspEligible: true } as EntitlementChecksForOrgAndUser,
    flags: {} as Flags,
    organization: undefined,
    isGroupOwner: null,
    isOrganizationOwner: false,
    memberships: undefined,
    groups: undefined,
    permissions: EMPTY_ORG_PERMISSIONS,
    ...overrides,
});

describe('getMspAppRoutes', () => {
    it('shows Monthly Costs to the organization owner', () => {
        const { routes } = getMspAppRoutes(buildParams({ isOrganizationOwner: true }));

        expect(routes.monthlyCosts.available).toBe(true);
    });

    it('hides Monthly Costs from an admin who is not the organization owner', () => {
        const { routes } = getMspAppRoutes(
            buildParams({ user: buildUser({ isAdmin: true }), isOrganizationOwner: false })
        );

        expect(routes.monthlyCosts.available).toBe(false);
    });

    it('shows Companies to a member who is not an admin', () => {
        const mspRoutes = getMspAppRoutes(
            buildParams({ user: buildUser({ isAdmin: false }), isOrganizationOwner: false })
        );

        expect(mspRoutes.available).toBe(true);
        expect(mspRoutes.routes.companies.available).toBe(true);
    });
});
