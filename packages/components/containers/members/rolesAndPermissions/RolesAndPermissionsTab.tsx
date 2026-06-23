import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { OrganizationRole, RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import { ROLE_SOURCE } from '@proton/shared/lib/interfaces/OrganizationRole';

import type { RoleRow } from './RoleCheckList';
import RoleCheckList from './RoleCheckList';

const buildRows = (
    organizationRoles: OrganizationRole[] = [],
    userRoles: RoleAssignment[] = [],
    selectedRoles: Set<string>
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
    }));
};

interface Props {
    selectedRoles: Set<string>;
    onChange: (selectedRoles: Set<string>) => void;
    organizationRoles: OrganizationRole[] | undefined;
    userRoles?: RoleAssignment[];
    loadingRoles: boolean;
    isGroupContext?: boolean;
    disabled?: boolean;
    banner?: ReactNode;
}

const RolesAndPermissionsTab = ({
    selectedRoles,
    onChange,
    organizationRoles,
    userRoles,
    loadingRoles,
    isGroupContext = false,
    disabled = false,
    banner,
}: Props) => {
    const rows = buildRows(organizationRoles, userRoles, selectedRoles);

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
                <RoleCheckList rows={rows} onToggle={handleToggle} disabled={disabled} />
            )}
        </div>
    );
};

export default RolesAndPermissionsTab;
