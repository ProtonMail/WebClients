import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

export const isOrganizationOLESEligible = ({
    organization,
    entitlements,
}: {
    organization: Organization | undefined;
    entitlements: EntitlementChecksForOrgAndUser;
}) => {
    return (
        !!organization &&
        entitlements.hasOrgMailboxMigration &&
        hasOrganizationSetupWithKeys(organization) &&
        organization.State === ORGANIZATION_STATE.ACTIVE
    );
};

export const isUserOLESEligible = ({
    user,
    organization,
    entitlements,
    hasOrgMigrationPermission,
}: {
    user: UserModel | undefined;
    organization: Organization | undefined;
    entitlements: EntitlementChecksForOrgAndUser;
    hasOrgMigrationPermission: boolean;
}) => {
    return Boolean(
        isOrganizationOLESEligible({ organization, entitlements }) && user?.isSelf && hasOrgMigrationPermission
    );
};
