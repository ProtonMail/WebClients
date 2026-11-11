import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { type Group, GroupFlags } from '@proton/shared/lib/interfaces/Group';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getGroupsPageAvailability } from './getGroupsPageAvailability';

const getOrganization = (overrides: Partial<OrganizationExtended> = {}) =>
    ({ State: ORGANIZATION_STATE.ACTIVE, RequiresKey: 1, HasKeys: 1, ...overrides }) as OrganizationExtended;

const buildGroup = (Flags: GroupFlags) => ({ ID: `group-${Flags}`, Flags }) as Group;

const getAvailability = ({
    organization = getOrganization(),
    plans,
    canReadGroups = true,
    groups = [],
    isGroupOwner = false,
}: {
    organization?: OrganizationExtended;
    plans: CataloguedPlan[];
    canReadGroups?: boolean;
    groups?: Group[];
    isGroupOwner?: boolean;
}) =>
    getGroupsPageAvailability({
        organization,
        entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans }),
        permissions: { 'account.group.read': canReadGroups },
        groups,
        isGroupOwner,
    });

describe('getGroupsPageAvailability', () => {
    it('shows the upsell to a Pass Essentials organization without groups', () => {
        expect(getAvailability({ plans: [PLANS.PASS_PRO] })).toEqual({ groups: true, upgradeRequired: true });
    });

    it('shows the upsell to a Pass Essentials organization without an organization key', () => {
        const organization = getOrganization({ HasKeys: 0 });

        expect(getAvailability({ organization, plans: [PLANS.PASS_PRO] })).toEqual({
            groups: true,
            upgradeRequired: true,
        });
    });

    it('shows the management UI to a Pass Professional organization', () => {
        expect(getAvailability({ plans: [PLANS.PASS_BUSINESS] })).toEqual({ groups: true, upgradeRequired: false });
    });

    it('shows the management UI to a Workspace organization', () => {
        expect(getAvailability({ plans: [PLANS.BUNDLE_PRO_2024] })).toEqual({ groups: true, upgradeRequired: false });
    });

    it('drops the upsell for a Pass Essentials organization that already has a group', () => {
        const groups = [buildGroup(GroupFlags.System), buildGroup(GroupFlags.None)];

        expect(getAvailability({ plans: [PLANS.PASS_PRO], groups })).toEqual({
            groups: true,
            upgradeRequired: false,
        });
    });

    it('keeps the upsell for a Pass Essentials organization that only has a system group', () => {
        const groups = [buildGroup(GroupFlags.System)];

        expect(getAvailability({ plans: [PLANS.PASS_PRO], groups })).toEqual({
            groups: true,
            upgradeRequired: true,
        });
    });

    it('hides the page from a Workspace organization without an active organization key', () => {
        const organization = getOrganization({ State: ORGANIZATION_STATE.DELINQUENT });

        expect(getAvailability({ organization, plans: [PLANS.BUNDLE_PRO_2024] }).groups).toBe(false);
    });

    it('hides the page from a plan without groups', () => {
        expect(getAvailability({ plans: [] }).groups).toBe(false);
    });

    it('hides the page without account.group.read', () => {
        expect(getAvailability({ plans: [PLANS.PASS_BUSINESS], canReadGroups: false }).groups).toBe(false);
    });

    it('shows the page to a group owner without account.group.read', () => {
        expect(getAvailability({ plans: [PLANS.PASS_BUSINESS], canReadGroups: false, isGroupOwner: true }).groups).toBe(
            true
        );
    });

    it('hides the page without an organization', () => {
        expect(
            getGroupsPageAvailability({
                organization: undefined,
                entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: [PLANS.PASS_PRO] }),
                permissions: { 'account.group.read': true },
                groups: [],
                isGroupOwner: false,
            }).groups
        ).toBe(false);
    });
});
