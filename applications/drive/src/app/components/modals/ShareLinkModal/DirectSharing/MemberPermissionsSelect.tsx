import { useCallback } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    IconName,
    usePopperAnchor,
} from '@proton/components/index';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

interface Props {
    selectedPermissions: number;
    onChange: (value: number) => void;
}

interface PermissionOption {
    icon: IconName;
    label: string;
    value: number;
}

const Option = ({
    option,
    isSelected,
    onSelect,
}: {
    option: PermissionOption;
    isSelected: boolean;
    onSelect: (value: number) => void;
}) => {
    const handleClick = useCallback(() => {
        onSelect(option.value);
    }, [option]);
    return (
        <DropdownMenuButton
            className="text-left flex justify-space-between items-center"
            key={option.value}
            onClick={handleClick}
        >
            <span className="flex items-center mr-14">
                <Icon name={option.icon} className="mr-2" />
                {option.label}
            </span>
            {isSelected ? <Icon name="checkmark" /> : null}
        </DropdownMenuButton>
    );
};

const MemberPermissionsSelect = ({ selectedPermissions, onChange }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const permissionsOptions: PermissionOption[] = [
        {
            icon: 'eye',
            label: c('Label').t`Viewer`,
            value: MEMBER_PERMISSIONS.VIEWER,
        },
        {
            icon: 'pencil',
            label: c('Label').t`Editor`,
            value: MEMBER_PERMISSIONS.EDITOR,
        },
    ];
    return (
        <>
            <DropdownButton
                className="self-center"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret
                shape="ghost"
                size="small"
            >
                {permissionsOptions.find((permission) => permission.value === selectedPermissions)?.label}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {permissionsOptions.map((option) => (
                        <Option option={option} isSelected={option.value === selectedPermissions} onSelect={onChange} />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default MemberPermissionsSelect;
