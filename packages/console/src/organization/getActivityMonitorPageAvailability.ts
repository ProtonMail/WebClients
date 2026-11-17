import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The full condition under which Account and Console show the Activity monitor page.
export const getActivityMonitorPageAvailability = ({
    organization,
    entitlements,
    permissions,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'isB2B'>;
    permissions: Pick<OrgPermissions, 'account.activity_log.read'>;
}) => {
    const isOrgConfigured = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);

    return {
        activityMonitor: (isOrgConfigured || entitlements.isB2B) && !!permissions['account.activity_log.read'],
    };
};
