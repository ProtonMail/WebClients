import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components/components';
import { resendGroupInvitation } from '@proton/shared/lib/api/groups';
import type { GroupMember } from '@proton/shared/lib/interfaces';
import { GroupMemberPermissions } from '@proton/shared/lib/interfaces';

interface PermissionOption {
    label: string;
    value: GroupMemberPermissions;
}

const Option = ({
    option,
    isSelected,
    onSelect,
}: {
    option: PermissionOption;
    isSelected?: boolean;
    onSelect: (value: GroupMemberPermissions) => void;
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
}

const GroupMemberItemDropdown = ({ member }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [selectedPermission, setSelectedPermission] = useState(GroupMemberPermissions.CanSend);

    const memberPermissionOptions: PermissionOption[] = [
        {
            label: c('Action').t`Can send to this group`,
            value: GroupMemberPermissions.CanSend,
        },
        { label: c('Action').t`Can't send to this group`, value: GroupMemberPermissions.CantSend },
    ];

    const handleResentInvitation = () => {
        resendGroupInvitation(member.ID);
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
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-start">
                <DropdownMenu>
                    {memberPermissionOptions.map((option) => (
                        <Option
                            key={option.value}
                            option={option}
                            isSelected={option.value === selectedPermission}
                            onSelect={(value) => {
                                setSelectedPermission(value);
                            }}
                        />
                    ))}
                    <hr className="mt-2" />
                    <DropdownMenuButton className="text-left" onClick={handleResentInvitation}>{c('Action')
                        .t`Resend invitation`}</DropdownMenuButton>
                    <DropdownMenuButton className="text-left color-danger">
                        {c('Action').t`Revoke invitation`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupMemberItemDropdown;
