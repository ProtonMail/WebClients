import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeOwnProps } from '@proton/atoms/Button/ButtonLike';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
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
                    {getExtraFieldOptions(onAdd).map(({ value, icon, label, onClick }) => (
                        <DropdownMenuButton key={value} onClick={onClick} size="small" icon={icon} label={label} />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
