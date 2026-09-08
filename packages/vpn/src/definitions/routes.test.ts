import { getOrgPermissions } from '@proton/account/userPermissions';
import type { NavResolved } from '@proton/nav/types/nav';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Entitlement } from '@proton/payments/core/entitlements/interface';
import { EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import { createEntitlementResolver } from '@proton/payments/core/entitlements/resolver';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import { APPS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';
import { buildUser } from '@proton/testing/builders/user';

import { findNavItem, resolveNavigation } from './routes';

const findNavItemById = vi.hoisted(() => vi.fn());

vi.mock('@proton/nav/api/findNavItem', () => ({
    findNavItemById,
}));

const nav = { items: [] } as NavResolved;

describe('findNavItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns undefined when nothing is found', () => {
        findNavItemById.mockReturnValue(undefined);
        expect(findNavItem(nav, 'my-vpn.download-apps')).toBeUndefined();
    });

    it('delegates to findNavItemById and returns the matched item', () => {
        const item = { id: 'my-vpn.download-apps', label: 'Downloads', sections: [] };
        findNavItemById.mockReturnValue(item);

        expect(findNavItem(nav, 'my-vpn.download-apps')).toBe(item);
        expect(findNavItemById).toHaveBeenCalledWith(nav, 'my-vpn.download-apps');
    });
});

describe('resolveNavigation', () => {
    const orgSwitch = (Name: EntitlementName): Entitlement => ({
        Name,
        Quantity: 1,
        Type: EntitlementType.Switch,
        Scope: EntitlementScope.Global,
    });

    const entitlements = createEntitlementResolver(
        makeEntitlements([
            orgSwitch(EntitlementName.Business),
            orgSwitch(EntitlementName.FlagsVpn),
            orgSwitch(EntitlementName.MaxDedicatedIps),
            orgSwitch(EntitlementName.VpnLocationFilter),
            orgSwitch(EntitlementName.ActivityMonitorVpn),
        ])
    );

    const organization = {
        Name: 'org',
        PlanName: PLANS.VPN_BUSINESS,
        State: ORGANIZATION_STATE.ACTIVE,
        RequiresKey: 1,
        HasKeys: 1,
        MaxMembers: 10,
        Settings: { VideoConferencingEnabled: false },
    } as OrganizationExtended;

    const buildArgs = (user: UserModel, permissions: OrgPermissions) => ({
        user,
        organization,
        permissions,
        entitlements,
        subscription: FREE_SUBSCRIPTION,
        flags: { SharedServerFeature: true, B2BAlwaysOnEnabled: true },
        context: {
            isDataRecoveryAvailable: true,
            isSessionRecoveryAvailable: true,
            appName: APPS.PROTONACCOUNT,
        },
    });

    const member = buildUser({ isAdmin: false, isMember: true, isFree: false, isPaid: true });
    const admin = buildUser({ isAdmin: true, isMember: false, isFree: false, isPaid: true });

    it('hides the organization group from a member who holds no permission', () => {
        const nav = resolveNavigation(buildArgs(member, getOrgPermissions([], false)));

        expect(nav.items.map((item) => item.id)).not.toContain('organization');
    });

    it('shows the organization group to an admin who holds a single permission', () => {
        const nav = resolveNavigation(buildArgs(admin, getOrgPermissions(['account.dashboard.read'], false)));

        expect(nav.items.map((item) => item.id)).toContain('organization');
    });
});
