import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

// The full condition under which Account and Console show the Organization keys page and its key section.
export const getOrganizationKeysPageAvailability = ({
    organization,
    entitlements,
    permissions,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: EntitlementChecksForOrgAndUser;
    permissions: Pick<OrgPermissions, 'account.organization_identity.read'>;
}) => {
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;
    const hasActiveOrganizationKey = isOrgActive && hasOrganizationSetupWithKeys(organization);
    const hasActiveOrganization = isOrgActive && hasOrganizationSetup(organization);
    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';

    return {
        organizationKeys:
            !!organization &&
            !!permissions['account.organization_identity.read'] &&
            (isPartOfFamily
                ? hasActiveOrganization
                : (hasActiveOrganizationKey || hasActiveOrganization) && !!organization.RequiresKey),
        passwordKeys: entitlements.isMultiUser && hasActiveOrganizationKey,
    };
};
