import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The condition under which Account, VPN settings and Console show the Gateways page.
export const getGatewaysPageAvailability = ({
    entitlements,
    permissions,
}: {
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'hasDedicatedIpsOrIsVpnB2B'>;
    permissions: Pick<OrgPermissions, 'account.gateway.read'>;
}) => ({
    gateways: !!permissions['account.gateway.read'] && entitlements.hasDedicatedIpsOrIsVpnB2B,
});
