import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { canManageOwnerRole, getUserSourcedRoleIds, isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useOrganizationRoles } from '@proton/account/organizationRoles/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { OrganizationRole, RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import { PREDEFINED_ROLE_NAME, ROLE_SOURCE } from '@proton/shared/lib/interfaces/OrganizationRole';

import type { RoleRow } from './RoleCheckList';
import RoleCheckList from './RoleCheckList';

const buildRows = (
    organizationRoles: OrganizationRole[] = [],
    userRoles: RoleAssignment[] = [],
    selectedRoles: Set<string>,
    lockOwnerRow: boolean,
    disableAll: boolean
): RoleRow[] => {
    const groupByRoleId = new Map(
        userRoles
            .filter(({ Source }) => Source === ROLE_SOURCE.GROUP)
            .map(({ Role, SourceGroupName }) => [Role.OrganizationRoleID, SourceGroupName])
    );
    const userSourcedRoleIds = getUserSourcedRoleIds(userRoles);

    return organizationRoles.map(({ OrganizationRoleID, Name, Description }) => {
        const hasGroupSource = groupByRoleId.has(OrganizationRoleID);
        const hasUserSource = userSourcedRoleIds.has(OrganizationRoleID);
        const isSelected = selectedRoles.has(OrganizationRoleID);

        const isGroupLocked = hasGroupSource && !(hasUserSource && isSelected);
        const isOwnerLocked = Name === PREDEFINED_ROLE_NAME.OWNER && lockOwnerRow;
        const groupName = groupByRoleId.get(OrganizationRoleID) ?? null;

        let badge = null;
        if (isGroupLocked) {
            badge = groupName ? c('user_modal').t`(via ${groupName})` : c('user_modal').t`(via group)`;
        }

        return {
            id: OrganizationRoleID,
            name: Name,
            description: Description,
            isChecked: isGroupLocked || isSelected,
            isDisabled: disableAll || isGroupLocked || isOwnerLocked,
            badge,
        };
    });
};

interface Props {
    selectedRoles: Set<string>;
    onChange: (selectedRoles: Set<string>) => void;
    userRoles?: RoleAssignment[];
    isGroupContext?: boolean;
    isEditingSelf?: boolean;
    disabled?: boolean;
    banner?: ReactNode;
}

const RolesAndPermissionsTab = ({
    selectedRoles,
    onChange,
    userRoles,
    isGroupContext = false,
    isEditingSelf = false,
    disabled = false,
    banner,
}: Props) => {
    const [organizationRoles, loadingRoles] = useOrganizationRoles();
    const [userPermissions] = useUserPermissions();
    const [organizationKey] = useOrganizationKey();
    const lockOwnerRow = !canManageOwnerRole({
        currentUserRoles: userPermissions?.Roles,
        isEditingSelf,
        hasOrgKeyAccess: Boolean(organizationKey?.privateKey),
    });
    const availableRoles = isGroupContext ? organizationRoles?.filter((role) => !isOwnerRole(role)) : organizationRoles;
    const rows = buildRows(availableRoles, userRoles, selectedRoles, lockOwnerRow, disabled);

    const handleToggle = (roleId: string) => {
        const next = new Set(selectedRoles);
        if (next.has(roleId)) {
            next.delete(roleId);
        } else {
            next.add(roleId);
        }
        onChange(next);
    };

    return (
        <div className="flex flex-column gap-4 mt-6">
            <p className="color-weak m-0">
                {isGroupContext
                    ? c('group_modal')
                          .t`Add delegated roles to a group to grant its members only the specific permissions they need, keeping full-admin power separate and your environment secure.`
                    : c('user_modal')
                          .t`Add delegated roles to a user to grant them only the specific permissions they need, keeping full-admin power separate and your environment secure.`}
            </p>
            {banner && <Banner variant={BannerVariants.INFO}>{banner}</Banner>}
            {loadingRoles ? (
                <div className="flex justify-center py-4">
                    <CircleLoader />
                </div>
            ) : (
                <RoleCheckList rows={rows} onToggle={handleToggle} isGroupContext={isGroupContext} />
            )}
        </div>
    );
};

export default RolesAndPermissionsTab;
