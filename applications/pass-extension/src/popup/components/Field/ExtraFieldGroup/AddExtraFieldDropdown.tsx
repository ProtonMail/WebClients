import { type VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import type { ExtraFieldType } from '@proton/pass/types';

import { DropdownMenuButton } from '../../Dropdown/DropdownMenuButton';
import { getExtraFieldOptions } from './ExtraField';

const DROPDOWN_SIZE: DropdownProps['size'] = { width: '11rem' };

type CustomFieldsDropdownProps = { onAdd: (type: ExtraFieldType) => void };

export const AddExtraFieldDropdown: VFC<CustomFieldsDropdownProps> = ({ onAdd }) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    const handleAddClick = (type: ExtraFieldType) => {
        onAdd(type);
        setTimeout(() => anchorRef?.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    return (
        <>
            <Button
                pill
                className="flex flex-align-items-center mb-2"
                color="norm"
                onClick={toggle}
                ref={anchorRef}
                shape="ghost"
            >
                <Icon className="mr-2" name="plus" />
                <span className="line-height-1">{c('Action').t`Add more`}</span>
            </Button>
            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                originalPlacement="top-start"
                size={DROPDOWN_SIZE}
            >
                <DropdownMenu>
                    {Object.entries(getExtraFieldOptions()).map(([type, { icon, label }]) => (
                        <DropdownMenuButton
                            key={type}
                            onClick={() => handleAddClick(type as ExtraFieldType)}
                            size="small"
                        >
                            <Icon className="mr-2 color-weak" name={icon} />
                            {label}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
