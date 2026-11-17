import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The full condition under which Account and Console show the Users page.
export const getUsersPageAvailability = ({
    organization,
    entitlements,
    permissions,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'isMultiUser'>;
    permissions: Pick<OrgPermissions, 'account.user.read'>;
}) => {
    const isOrgConfigured = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;
    const isOrgDelinquent = organization?.State === ORGANIZATION_STATE.DELINQUENT;
    const hasUsedMembers = (organization?.UsedMembers ?? 0) > 1;

    return {
        users:
            !!permissions['account.user.read'] &&
            isOrgConfigured &&
            // A delinquent organization keeps the page so that it can delete its sub users.
            ((isOrgDelinquent && hasUsedMembers) || (isOrgActive && entitlements.isMultiUser)),
    };
};
