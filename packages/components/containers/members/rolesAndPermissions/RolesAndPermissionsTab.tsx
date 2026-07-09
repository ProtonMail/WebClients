import type { ReactNode } from 'react';

import { c } from 'ttag';

import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
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
    lockOwnerRow: boolean
): RoleRow[] => {
    const groupByRoleId = new Map(
        userRoles
            .filter(({ Source }) => Source === ROLE_SOURCE.GROUP)
            .map(({ Role, SourceGroupName }) => [Role.OrganizationRoleID, SourceGroupName])
    );
    return organizationRoles.map(({ OrganizationRoleID, Name, Description }) => ({
        id: OrganizationRoleID,
        name: Name,
        description: Description,
        isGroupSourced: groupByRoleId.has(OrganizationRoleID),
        groupName: groupByRoleId.get(OrganizationRoleID) ?? null,
        isChecked: groupByRoleId.has(OrganizationRoleID) || selectedRoles.has(OrganizationRoleID),
        isLocked: Name === PREDEFINED_ROLE_NAME.OWNER && lockOwnerRow,
    }));
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
    const isCurrentUserOwner = userPermissions?.Roles?.some(isOwnerRole) ?? false;
    const lockOwnerRow = !isCurrentUserOwner || isEditingSelf;
    const availableRoles = isGroupContext ? organizationRoles?.filter((role) => !isOwnerRole(role)) : organizationRoles;
    const rows = buildRows(availableRoles, userRoles, selectedRoles, lockOwnerRow);

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
                <RoleCheckList
                    rows={rows}
                    onToggle={handleToggle}
                    disabled={disabled}
                    isGroupContext={isGroupContext}
                />
            )}
        </div>
    );
};

export default RolesAndPermissionsTab;
