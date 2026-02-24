import React from 'react';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { Unit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';

export interface MenuItemProps {
    iconName: IconName;
    getLabel: () => string;
    onClick: () => void;
    onClose: () => void;
    rightElement?: React.ReactNode;
}

export const MenuItem = ({ iconName, getLabel, onClick, onClose, rightElement }: MenuItemProps) => (
    <DropdownMenuButton
        onClick={() => {
            onClick();
            onClose();
        }}
        className="justify-start"
    >
        <div className="flex items-center gap-3">
            <Icon name={iconName} size={5} className="color-weak" />
            <div className="flex flex-column">
                <span className="text-sm font-medium">{getLabel()}</span>
            </div>
            {rightElement}
        </div>
    </DropdownMenuButton>
);

export interface MenuDropdownProps {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLElement>;
    onClose: () => void;
    className?: string;
    width?: string;
    children?: React.ReactNode;
}

export const MenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    className = '',
    width = '200px',
    children,
}: MenuDropdownProps) => {
    return (
        <Dropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            originalPlacement="top-start"
            size={{
                width: width as Unit,
            }}
            className={className}
        >
            {children}
        </Dropdown>
    );
};
