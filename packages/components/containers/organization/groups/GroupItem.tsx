import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { useApi } from '@proton/components/hooks';
import { deleteAllGroupMembers, deleteGroup } from '@proton/shared/lib/api/groups';
import type { Group } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import GroupItemMoreOptionsDropdown from './GroupItemMoreOptionsDropdown';

import './GroupItem.scss';

interface Props {
    active: boolean;
    groupData: Group;
    onClick?: () => void;
    isNew?: boolean;
    onDeleteGroup?: () => void;
}

const GroupItem = ({ active, groupData: { ID, MemberCount, Address, Name }, onClick, isNew, onDeleteGroup }: Props) => {
    const api = useApi();

    const memberCount = MemberCount ?? 0;

    const handleDeleteGroup = async () => {
        await api(deleteGroup(ID));
        onDeleteGroup?.();
    };

    const handleDeleteAllGroupMembers = async () => {
        await api(deleteAllGroupMembers(ID));
    };

    return (
        <div className="relative">
            <Button
                className={clsx(['interactive-pseudo w-full', active && 'is-active'])}
                color="weak"
                shape="ghost"
                onClick={onClick}
            >
                <div className="text-left flex items-start">
                    <div
                        className="mr-2 mb-2 rounded flex w-custom h-custom group-item-avatar"
                        style={{
                            '--w-custom': '1.75rem',
                            '--h-custom': '1.75rem',
                        }}
                    >
                        <Icon className="m-auto shrink-0 color-primary" size={4} name="users-filled" />
                    </div>
                    <div className="text-left flex flex-column gap-2">
                        <p className="m-0">
                            <p className="m-0 text-bold text-lg text-ellipsis">{Name}</p>
                            {Address.Email && <p className="m-0 text-ellipsis">{Address.Email}</p>}
                        </p>
                        <p className="m-0 text-sm color-weak">
                            {c('Group member count').ngettext(
                                msgid`${memberCount} member`,
                                `${memberCount} members`,
                                memberCount
                            )}
                        </p>
                    </div>
                    {!isNew && (
                        <div className="absolute top-0 right-0 mt-2 mr-2">
                            <GroupItemMoreOptionsDropdown
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
