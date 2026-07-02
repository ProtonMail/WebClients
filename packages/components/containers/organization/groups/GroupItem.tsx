import { c } from 'ttag';

import { getIsScimGroup } from '@proton/account/groups/groupFlags';
import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useApi from '@proton/components/hooks/useApi';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { deleteAllGroupMembers } from '@proton/shared/lib/api/groups';
import type { Group, RoleAssignment } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import GroupIcon from './GroupIcon';
import GroupItemMoreOptionsDropdown from './GroupItemMoreOptionsDropdown';
import shouldShowMail from './shouldShowMail';
import type { GroupsManagementReturn } from './types';

interface Props {
    active: boolean;
    group?: Group;
    onClick?: () => void;
    isNew?: boolean;
    onDeleteGroup?: () => void;
    name?: string;
    serializedGroup?: ReturnType<GroupsManagementReturn['getSerializedGroup']>;
    groupOrganizationRoles?: RoleAssignment[];
    hasPendingRoleAssignment?: boolean;
}

const GroupItem = ({
    active,
    group,
    serializedGroup,
    onClick,
    isNew,
    onDeleteGroup,
    groupOrganizationRoles,
    hasPendingRoleAssignment,
}: Props) => {
    const api = useApi();
    const [organization] = useOrganization();
    const showMailFeatures = shouldShowMail(organization?.PlanName);

    const roleNames = groupOrganizationRoles?.map((assignment) => assignment.Role.Name).join(', ');

    const handleDeleteGroup = async () => {
        onDeleteGroup?.();
    };

    const handleDeleteAllGroupMembers = group
        ? async () => {
              await api(deleteAllGroupMembers(group.ID));
          }
        : undefined;

    const name = (serializedGroup?.payload.name ?? group?.Name) || c('Empty group name').t`Unnamed`;
    const email = serializedGroup?.payload.email || group?.Address?.Email || '';
    const subtitle = roleNames || (showMailFeatures && email ? email : undefined);

    return (
        <div className="relative">
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
                            {hasPendingRoleAssignment && (
                                <Tooltip title={c('tooltip').t`Role assignment paused`}>
                                    <span className="inline-flex shrink-0">
                                        <IcExclamationCircle
                                            className="color-warning"
                                            alt={c('tooltip').t`Role assignment paused`}
                                        />
                                    </span>
                                </Tooltip>
                            )}
                        </div>
                        {subtitle && (
                            <p className="m-0 max-w-full text-sm color-weak text-ellipsis" title={subtitle}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {group && !isNew && handleDeleteAllGroupMembers && (
                        <div className="shrink-0">
                            <GroupItemMoreOptionsDropdown
                                showMailFeatures={showMailFeatures}
                                handleDeleteGroup={handleDeleteGroup}
                                handleDeleteAllGroupMembers={handleDeleteAllGroupMembers}
                            />
                        </div>
                    )}
                </div>
            </Button>
        </div>
    );
};

export default GroupItem;
