import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The full condition under which Account and Console show the Access control page and its Lumo API toggle.
export const getAccessControlPageAvailability = ({
    organization,
    entitlements,
    permissions,
    isLumoApiEnabled,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'isMultiUser'>;
    permissions: Pick<OrgPermissions, 'account.access_control.read'>;
    isLumoApiEnabled: boolean;
}) => {
    const isOrgConfigured = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);
    const hasSubUsers = (organization?.UsedMembers ?? 0) > 1;

    return {
        accessControl: !!permissions['account.access_control.read'] && (hasSubUsers || isOrgConfigured),
        lumoApi: isLumoApiEnabled && entitlements.isMultiUser,
    };
};
