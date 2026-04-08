import { c, msgid } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms/Button/Button';
import useApi from '@proton/components/hooks/useApi';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { deleteAllGroupMembers } from '@proton/shared/lib/api/groups';
import type { Group } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import GroupItemMoreOptionsDropdown from './GroupItemMoreOptionsDropdown';
import shouldShowMail from './shouldShowMail';
import type { GroupsManagementReturn } from './types';

interface Props {
    active: boolean;
    group?: Group;
    onClick?: () => void;
    isNew?: boolean;
    onDeleteGroup?: () => void;
    canOnlyDelete: boolean;
    name?: string;
    serializedGroup?: ReturnType<GroupsManagementReturn['getSerializedGroup']>;
}

const GroupItem = ({ active, group, serializedGroup, onClick, isNew, onDeleteGroup, canOnlyDelete }: Props) => {
    const api = useApi();
    const [organization] = useOrganization();
    const showMailFeatures = shouldShowMail(organization?.PlanName);

    const memberCount = group && Number.isInteger(group.MemberCount) ? group.MemberCount : undefined;

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

    return (
        <div className="relative">
            <Button
                className={clsx(['group-button interactive-pseudo w-full p-4', active && 'is-active'])}
                color="weak"
                shape="ghost"
                onClick={onClick}
            >
                <div className="text-left flex items-start flex-nowrap gap-2">
                    <div
                        className="mr-1 rounded flex w-custom h-custom shrink-0"
                        style={{
                            '--w-custom': '2rem',
                            '--h-custom': '2rem',
                            backgroundColor: 'var(--interaction-norm-minor-1)',
                        }}
                    >
                        <IcUsers className="m-auto color-primary shrink-0" size={4} />
                    </div>
                    <div className="text-left flex flex-column flex-1">
                        <span className="block max-w-full text-bold text-ellipsis" title={name}>
                            {name}
                        </span>
                        {showMailFeatures && email && (
                            <span className="block max-w-full text-ellipsis" title={email}>
                                {email}
                            </span>
                        )}
                        {memberCount !== undefined && (
                            <p className="m-0 text-sm color-weak">
                                {c('Group member count').ngettext(
                                    msgid`${memberCount} member`,
                                    `${memberCount} members`,
                                    memberCount
                                )}
                            </p>
                        )}
                    </div>
                    {group && !isNew && handleDeleteAllGroupMembers && (
                        <div className="shrink-0">
                            <GroupItemMoreOptionsDropdown
                                group={group}
                                showMailFeatures={showMailFeatures}
                                handleDeleteGroup={handleDeleteGroup}
                                handleDeleteAllGroupMembers={handleDeleteAllGroupMembers}
                                canOnlyDelete={canOnlyDelete}
                            />
                        </div>
                    )}
                </div>
            </Button>
        </div>
    );
};

export default GroupItem;
