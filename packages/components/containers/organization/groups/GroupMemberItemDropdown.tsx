import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useApi, useEventManager } from '@proton/components';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    usePopperAnchor,
} from '@proton/components/components';
import { deleteGroupMember as revokeGroupInvitation, updateGroupMember } from '@proton/shared/lib/api/groups';
import { clearBit, hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_PERMISSIONS } from '@proton/shared/lib/interfaces';

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
    const { call } = useEventManager();

    const memberPermissionOptions: PermissionOption[] = [
        {
            label: c('Action').t`Always allow sending mail to group`,
            value: GROUP_MEMBER_PERMISSIONS.OverrideGroupPermissions,
        },
        { label: c('Action').t`Use group sending permissions`, value: GROUP_MEMBER_PERMISSIONS.None },
    ];

    const handleRevokeInvitation = async () => {
        await api(revokeGroupInvitation(member.ID));
        await call();
    };

    const handleOverrideGroupPermissions = async (value: number) => {
        const newPermissions = setBit(
            clearBit(member.Permissions, GROUP_MEMBER_PERMISSIONS.OverrideGroupPermissions),
            value
        );
        await api(
            updateGroupMember(member.ID, {
                GroupID: group.ID,
                Permissions: newPermissions,
            })
        );
        await call();
    };

    const overrideGroupPermissions: GROUP_MEMBER_PERMISSIONS = hasBit(
        member.Permissions,
        GROUP_MEMBER_PERMISSIONS.OverrideGroupPermissions
    )
        ? GROUP_MEMBER_PERMISSIONS.OverrideGroupPermissions
        : GROUP_MEMBER_PERMISSIONS.None;

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
                    <DropdownMenuButton className="text-left color-danger" onClick={handleRevokeInvitation}>
                        {c('Action').t`Revoke invitation`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupMemberItemDropdown;
