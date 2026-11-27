import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The condition under which Console shows the Domain names page. Unlike Account, it doesn't hide the page on plans
// without custom domains: those will get an upsell there.
export const getDomainNamesPageAvailability = ({
    organization,
    permissions,
}: {
    organization: OrganizationExtended | undefined;
    permissions: Pick<OrgPermissions, 'account.domain.read'>;
}) => {
    const isOrgConfigured = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);

    return {
        domainNames: !!permissions['account.domain.read'] && isOrgConfigured,
    };
};
