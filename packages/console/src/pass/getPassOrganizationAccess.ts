import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

export const getPassOrganizationAccess = ({
    organization,
    entitlements,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: EntitlementChecksForOrgAndUser;
}) => {
    // MSP subsidiary orgs don't own their subscription (it belongs to the MSP manager), so `subscription`
    // resolves to the free/dummy value for them. Workaround: MSP currently only runs on Pass Pro, which is
    // already a B2B plan, so treat subsidiaries as such directly (same pattern as organization/routes.ts).
    const isMspSubsidiary = !!organization?.IsSubsidiary;

    return {
        hasPassB2B: entitlements.isPassB2B || isMspSubsidiary,
        isPolicyUpgradeRequired: !isMspSubsidiary && !entitlements.hasOrganizationPolicy,
    };
};

// The full condition under which Account and Console show each Pass organization page.
export const getPassPageAvailability = ({
    organization,
    entitlements,
    permissions,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: EntitlementChecksForOrgAndUser;
    permissions: Pick<OrgPermissions, 'pass.policy.read' | 'pass.report.read'>;
}) => {
    const hasOrganization = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);
    const { hasPassB2B } = getPassOrganizationAccess({ organization, entitlements });

    return {
        policies: hasOrganization && permissions['pass.policy.read'] && hasPassB2B,
        reports: hasOrganization && permissions['pass.report.read'] && hasPassB2B,
    };
};
