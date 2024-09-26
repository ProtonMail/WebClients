import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { useApi } from '@proton/components/hooks';
import { deleteAllGroupMembers } from '@proton/shared/lib/api/groups';
import type { Group } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import GroupItemMoreOptionsDropdown from './GroupItemMoreOptionsDropdown';

interface Props {
    active: boolean;
    groupData: Group;
    onClick?: () => void;
    isNew?: boolean;
    onDeleteGroup?: () => void;
    canOnlyDelete: boolean;
}

const GroupItem = ({
    active,
    groupData: { ID, MemberCount, Address: address, Name },
    groupData: group,
    onClick,
    isNew,
    onDeleteGroup,
    canOnlyDelete,
}: Props) => {
    const api = useApi();

    const memberCount = Number.isInteger(MemberCount) ? MemberCount : undefined;

    const handleDeleteGroup = async () => {
        onDeleteGroup?.();
    };

    const handleDeleteAllGroupMembers = async () => {
        await api(deleteAllGroupMembers(ID));
    };

    return (
        <div className="relative">
            <Button
                className={clsx(['group-button interactive-pseudo w-full pr-2 py-4', active && 'is-active'])}
                color="weak"
                shape="ghost"
                onClick={onClick}
            >
                <div className="text-left flex items-start flex-nowrap">
                    <div
                        className="mr-2 mb-2 rounded flex w-custom h-custom shrink-0 "
                        style={{
                            '--w-custom': '1.75rem',
                            '--h-custom': '1.75rem',
                        }}
                    >
                        <Icon className="m-auto color-primary shrink-0" size={4} name="users-filled" />
                    </div>
                    <div className="text-left flex flex-column flex-1">
                        <span className="block max-w-full text-bold text-lg text-ellipsis" title={Name}>
                            {Name}
                        </span>
                        {address.Email && (
                            <span className="block max-w-full text-ellipsis" title={address.Email}>
                                {address.Email}
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
                    {!isNew && (
                        <div className="shrink-0">
                            <GroupItemMoreOptionsDropdown
                                group={group}
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
