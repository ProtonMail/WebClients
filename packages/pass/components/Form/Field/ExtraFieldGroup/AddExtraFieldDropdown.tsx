import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Dropdown, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import type { ExtraFieldType } from '@proton/pass/types';

import { getExtraFieldOptions } from './ExtraField';

type CustomFieldsDropdownProps = { onAdd: (type: ExtraFieldType) => void };

export const AddExtraFieldDropdown: FC<CustomFieldsDropdownProps> = ({ onAdd }) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    const handleAddClick = (type: ExtraFieldType) => {
        onAdd(type);
        setTimeout(() => anchorRef?.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    return (
        <>
            <Button pill className="flex items-center mb-2" color="norm" onClick={toggle} ref={anchorRef} shape="ghost">
                <Icon className="mr-2" name="plus" />
                <span className="line-height-1">{c('Action').t`Add more`}</span>
            </Button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close} originalPlacement="top-start">
                <DropdownMenu>
                    {Object.entries(getExtraFieldOptions()).map(([type, { icon, label }]) => (
                        <DropdownMenuButton
                            key={type}
                            onClick={() => handleAddClick(type as ExtraFieldType)}
                            size="small"
                            icon={icon}
                            label={label}
                        />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
