import { c } from 'ttag';

import { resumeGroupMember as resumeGroupMemberAction, updateOverridePermissions } from '@proton/account';
import { Button } from '@proton/atoms';
import { useApi, useEventManager } from '@proton/components';
import { usePopperAnchor } from '@proton/components/components';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import { baseUseDispatch } from '@proton/react-redux-store';
import {
    resumeGroupMember as resumeGroupMemberApi,
    deleteGroupMember as revokeGroupInvitation,
    updateGroupMember,
} from '@proton/shared/lib/api/groups';
import { clearBit, hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_PERMISSIONS, GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';

import { useErrorHandler } from '../../../hooks';

interface PermissionOption {
    label: string;
    value: GROUP_MEMBER_PERMISSIONS;
}

const Option = ({
    option,
    isSelected,
    onSelect,
}: {
    option: PermissionOption;
    isSelected?: boolean;
    onSelect: (value: GROUP_MEMBER_PERMISSIONS) => void;
}) => {
    return (
        <DropdownMenuButton
            className="text-left flex justify-space-between items-center"
            key={option.value}
            onClick={() => onSelect(option.value)}
        >
            <span className="flex items-center mr-14">{option.label}</span>
            {isSelected ? <Icon className="color-primary" name="checkmark" /> : null}
        </DropdownMenuButton>
    );
};

interface Props {
    member: GroupMember;
    group: Group; // needs to be removed once backend doesn't need Group.ID
}

const GroupMemberItemDropdown = ({ member, group }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const api = useApi();
    const handleError = useErrorHandler();
    const { call } = useEventManager();
    const dispatch = baseUseDispatch();

    const memberPermissionOptions: PermissionOption[] = [
        { label: c('Action').t`Use group sending permissions`, value: GROUP_MEMBER_PERMISSIONS.NONE },
        {
            label: c('Action').t`Always allow sending`,
            value: GROUP_MEMBER_PERMISSIONS.SEND,
        },
    ];

    const handleRevokeInvitation = async () => {
        await api(revokeGroupInvitation(member.ID));
        await call();
    };

    const handleResumeInvitation = async () => {
        try {
            await api(resumeGroupMemberApi(member.ID));
            dispatch(
                resumeGroupMemberAction({
                    groupID: group.ID,
                    memberID: member.ID,
                })
            );
        } catch (error) {
            handleError(error);
        }
    };

    const handleOverrideGroupPermissions = async (value: number) => {
        try {
            const newPermissions = setBit(clearBit(member.Permissions, GROUP_MEMBER_PERMISSIONS.SEND), value);
            await api(
                updateGroupMember(member.ID, {
                    GroupID: group.ID,
                    Permissions: newPermissions,
                })
            );
            dispatch(
                updateOverridePermissions({
                    groupID: group.ID,
                    memberID: member.ID,
                    newValue: newPermissions,
                })
            );
        } catch (error) {
            handleError(error);
        }
    };

    const overrideGroupPermissions: GROUP_MEMBER_PERMISSIONS = hasBit(member.Permissions, GROUP_MEMBER_PERMISSIONS.SEND)
        ? GROUP_MEMBER_PERMISSIONS.SEND
        : GROUP_MEMBER_PERMISSIONS.NONE;

    const isPaused = member.State === GROUP_MEMBER_STATE.PAUSED;

    return (
        <>
            <Button
                shape="ghost"
                size="small"
                icon
                ref={anchorRef}
                onClick={() => {
                    toggle();
                }}
                title={c('Action').t`More options`}
                aria-expanded={isOpen}
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
            </Button>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom-start"
                size={{ width: DropdownSizeUnit.Dynamic, maxWidth: DropdownSizeUnit.Viewport }}
            >
                <DropdownMenu>
                    {memberPermissionOptions.map((option) => (
                        <Option
                            key={option.value}
                            option={option}
                            isSelected={option.value === overrideGroupPermissions}
                            onSelect={handleOverrideGroupPermissions}
                        />
                    ))}
                    <hr className="mt-2 mb-0" />
                    {isPaused && (
                        <DropdownMenuButton className="text-left" onClick={handleResumeInvitation}>
                            {c('Action').t`Resume membership`}
                        </DropdownMenuButton>
                    )}
                    <DropdownMenuButton className="text-left color-danger" onClick={handleRevokeInvitation}>
                        {c('Action').t`Revoke invitation`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupMemberItemDropdown;
