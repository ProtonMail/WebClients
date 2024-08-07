import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useApi } from '@proton/components';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    usePopperAnchor,
} from '@proton/components/components';
import {
    resendGroupInvitation,
    deleteGroupMember as revokeGroupInvitation,
    updateGroupMember,
} from '@proton/shared/lib/api/groups';
import { clearBit, setBit } from '@proton/shared/lib/helpers/bitset';
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
    const [selectedPermission, setSelectedPermission] = useState(member.Permissions);
    const api = useApi();

    const memberPermissionOptions: PermissionOption[] = [
        {
            label: c('Action').t`Always allow sending mail to group`,
            value: GROUP_MEMBER_PERMISSIONS.OverrideGroupPermissions,
        },
        { label: c('Action').t`Use group sending permissions`, value: GROUP_MEMBER_PERMISSIONS.None },
    ];

    const handleResentInvitation = () => {
        void api(resendGroupInvitation(member.ID));
    };

    const handleRevokeInvitation = () => {
        void api(revokeGroupInvitation(member.ID));
    };

    const handleOverrideGroupPermissions = (value: number) => {
        setSelectedPermission(value);
        const newPermissions = setBit(
            clearBit(member.Permissions, GROUP_MEMBER_PERMISSIONS.OverrideGroupPermissions),
            value
        );
        void api(
            updateGroupMember(member.ID, {
                GroupID: group.ID,
                Permissions: newPermissions,
            })
        );
    };

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
                            isSelected={option.value === selectedPermission}
                            onSelect={handleOverrideGroupPermissions}
                        />
                    ))}
                    <hr className="mt-2" />
                    <DropdownMenuButton className="text-left" onClick={handleResentInvitation}>
                        {c('Action').t`Resend invitation`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left color-danger" onClick={handleRevokeInvitation}>
                        {c('Action').t`Revoke invitation`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupMemberItemDropdown;
