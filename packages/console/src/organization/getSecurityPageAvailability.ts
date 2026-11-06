import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

const isOrgConfigured = (organization: OrganizationExtended | undefined) =>
    hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);

// The full condition under which Account and Console show the Security page and its Sentinel section.
export const getSecurityPageAvailability = ({
    organization,
    entitlements,
    permissions,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: EntitlementChecksForOrgAndUser;
    permissions: Pick<OrgPermissions, 'account.security_policy.read' | 'account.activity_log.read'>;
}) => ({
    security:
        !!permissions['account.security_policy.read'] &&
        organization?.State === ORGANIZATION_STATE.ACTIVE &&
        isOrgConfigured(organization) &&
        (organization.MaxMembers > 1 || organization.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED),
    sentinel: (isOrgConfigured(organization) || entitlements.isB2B) && !!permissions['account.activity_log.read'],
});
