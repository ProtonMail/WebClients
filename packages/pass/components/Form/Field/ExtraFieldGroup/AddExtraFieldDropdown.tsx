import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeOwnProps } from '@proton/atoms/Button/ButtonLike';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import type { ExtraFieldType } from '../../../../types';
import { DropdownMenuButton } from '../../../Layout/Dropdown/DropdownMenuButton';
import { getExtraFieldOptions } from './ExtraField.utils';

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
                <IcPlus className="mr-2" />
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
