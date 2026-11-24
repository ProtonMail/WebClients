import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The condition under which Account, VPN settings and Console show the Shared servers page.
export const getSharedServersPageAvailability = ({
    entitlements,
    permissions,
}: {
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'hasVpnLocationFilter'>;
    permissions: Pick<OrgPermissions, 'account.shared_server.read'>;
}) => ({
    sharedServers: !!permissions['account.shared_server.read'] && entitlements.hasVpnLocationFilter,
});
