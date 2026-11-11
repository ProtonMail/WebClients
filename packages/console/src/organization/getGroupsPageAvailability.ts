import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { type Group, GroupFlags } from '@proton/shared/lib/interfaces/Group';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The full condition under which Account and Console show the Groups page, and whether it shows the upsell.
export const getGroupsPageAvailability = ({
    organization,
    entitlements,
    permissions,
    groups,
    isGroupOwner,
}: {
    organization: OrganizationExtended | undefined;
    entitlements: EntitlementChecksForOrgAndUser;
    permissions: Pick<OrgPermissions, 'account.group.read'>;
    groups: Group[] | undefined;
    isGroupOwner: boolean;
}) => {
    const alreadyHasGroups = !!groups?.some((group) => !hasBit(group.Flags, GroupFlags.System));
    const hasActiveOrganizationKey =
        organization?.State === ORGANIZATION_STATE.ACTIVE && hasOrganizationSetupWithKeys(organization);
    const canUseGroups = hasActiveOrganizationKey && entitlements.hasGroups;
    // Pass B2B plans without groups keep the page, with an upsell, even without an organization key.
    const canUpgradeToGroups = entitlements.isPassB2BWithoutGroups;

    return {
        groups:
            (!!permissions['account.group.read'] || isGroupOwner) &&
            !!organization &&
            (alreadyHasGroups || canUpgradeToGroups || canUseGroups),
        upgradeRequired: !entitlements.hasGroups && !alreadyHasGroups,
    };
};
