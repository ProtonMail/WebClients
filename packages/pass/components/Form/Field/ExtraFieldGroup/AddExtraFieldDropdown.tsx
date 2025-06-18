import { type FC } from 'react';

import { c } from 'ttag';

import { Button, type ButtonLikeOwnProps } from '@proton/atoms';
import { Dropdown, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { getExtraFieldOptions } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField.utils';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import type { ExtraFieldType } from '@proton/pass/types';

export type CustomButtonProps = ButtonLikeOwnProps & { label?: string };
type CustomFieldsDropdownProps = { onAdd: (type: ExtraFieldType) => void } & CustomButtonProps;

export const AddExtraFieldDropdown: FC<CustomFieldsDropdownProps> = ({
    onAdd,
    shape = 'ghost',
    color = 'norm',
    label,
}) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    const handleAddClick = (type: ExtraFieldType) => {
        onAdd(type);
        setTimeout(() => anchorRef?.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    return (
        <>
            <Button
                pill
                className="flex items-center my-4"
                color={color}
                onClick={toggle}
                ref={anchorRef}
                shape={shape}
            >
                <Icon className="mr-2" name="plus" />
                <span className="line-height-1">{label ?? c('Action').t`Add more`}</span>
            </Button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close} originalPlacement="top-start">
                <DropdownMenu>
                    {getExtraFieldOptions(handleAddClick).map(({ value, icon, label, onClick }) => (
                        <DropdownMenuButton key={value} onClick={onClick} size="small" icon={icon} label={label} />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
