import { c } from 'ttag';

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
}

const RolesAndPermissionsTab = ({ selectedRoles, onChange, organizationRoles, userRoles, loadingRoles }: Props) => {
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
        <>
            <p className="color-weak mt-6 mb-8">
                {c('user_modal')
                    .t`Add delegated roles to a user to grant them only the specific permissions they need, keeping full-admin power separate and your environment secure.`}
            </p>
            {loadingRoles ? (
                <div className="flex justify-center py-4">
                    <CircleLoader />
                </div>
            ) : (
                <RoleCheckList rows={rows} onToggle={handleToggle} />
            )}
        </>
    );
};

export default RolesAndPermissionsTab;
