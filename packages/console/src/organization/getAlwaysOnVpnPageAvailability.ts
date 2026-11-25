import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The condition under which Account, VPN settings and Console show the Always-on VPN page.
export const getAlwaysOnVpnPageAvailability = ({
    entitlements,
    permissions,
    isAlwaysOnVpnEnabled,
}: {
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'isVpnB2B'>;
    permissions: Pick<OrgPermissions, 'account.always_on.read'>;
    isAlwaysOnVpnEnabled: boolean;
}) => ({
    alwaysOnVpn: isAlwaysOnVpnEnabled && !!permissions['account.always_on.read'] && entitlements.isVpnB2B,
});
