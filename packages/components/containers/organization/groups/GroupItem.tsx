import { c } from 'ttag';

import { getIsScimGroup } from '@proton/account/groups/groupFlags';
import { useOrganization } from '@proton/account/organization/hooks';
import { getTranslatedRoleName } from '@proton/account/organizationRoles/helpers';
import { Button } from '@proton/atoms/Button/Button';
import RoleAssignmentStatusIcon from '@proton/components/containers/members/rolesAndPermissions/RoleAssignmentStatusIcon';
import type { EnhancedGroup } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import GroupIcon from './GroupIcon';
import GroupItemMoreOptionsDropdown from './GroupItemMoreOptionsDropdown';
import { useGroupsManagement } from './context/GroupsManagementContext';
import shouldShowMail from './shouldShowMail';
import { GROUPS_RESTRICTION_REASON, type GroupsManagementReturn } from './types';

interface Props {
    active: boolean;
    group?: EnhancedGroup;
    onClick?: () => void;
    isNew?: boolean;
    onDeleteGroup?: () => void;
    serializedGroup?: ReturnType<GroupsManagementReturn['getSerializedGroup']>;
}

const GroupItem = ({ active, group, serializedGroup, onClick, isNew, onDeleteGroup }: Props) => {
    const [organization] = useOrganization();
    const { groupRolesMap, restrictedBy } = useGroupsManagement();
    const showMailFeatures = shouldShowMail(organization?.PlanName);

    const groupOrganizationRoles = group ? groupRolesMap[group.ID] : undefined;
    const roleNames = groupOrganizationRoles
        ?.map((assignment) => getTranslatedRoleName(assignment.Role.Name))
        .join(', ');
    const isResumingRoleAssignment =
        restrictedBy.reason === GROUPS_RESTRICTION_REASON.RESUMING_ROLE_ASSIGNMENT &&
        restrictedBy.groupId === group?.ID;

    const handleDeleteGroup = async () => {
        onDeleteGroup?.();
    };

    const name = (serializedGroup?.payload.name ?? group?.Name) || c('Empty group name').t`Unnamed`;
    const email = serializedGroup?.payload.email || group?.Address?.Email || '';
    const subtitle = roleNames || (showMailFeatures && email ? email : undefined);

    return (
        <div className="relative mb-1">
            <Button
                className={clsx(['group-button interactive-pseudo w-full p-4 rounded-xl', active && 'is-active'])}
                color="weak"
                shape="ghost"
                onClick={onClick}
            >
                <div className="text-left flex items-center flex-nowrap gap-2">
                    <div
                        className="mr-1 rounded flex w-custom h-custom shrink-0"
                        style={{
                            '--w-custom': '2rem',
                            '--h-custom': '2rem',
                            backgroundColor: 'var(--interaction-norm-minor-1)',
                        }}
                    >
                        <GroupIcon
                            isScimGroup={getIsScimGroup(group)}
                            className="m-auto color-primary shrink-0"
                            size={4}
                        />
                    </div>
                    <div className="text-left flex flex-column flex-1">
                        <div className="flex items-center flex-nowrap gap-1">
                            <span className="text-bold text-ellipsis min-w-0" title={name}>
                                {name}
                            </span>
                            {group?.requiresOrgKeyPromotion && (
                                <RoleAssignmentStatusIcon isResuming={isResumingRoleAssignment} />
                            )}
                        </div>
                        {subtitle && (
                            <p className="m-0 max-w-full text-sm color-weak text-ellipsis" title={subtitle}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {group && !isNew && (
                        <div className="shrink-0">
                            <GroupItemMoreOptionsDropdown
                                group={group}
                                showMailFeatures={showMailFeatures}
                                handleDeleteGroup={handleDeleteGroup}
                            />
                        </div>
                    )}
                </div>
            </Button>
        </div>
    );
};

export default GroupItem;
