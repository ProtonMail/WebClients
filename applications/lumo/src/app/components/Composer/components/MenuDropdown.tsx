import React from 'react';

import Dropdown, { type DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { Unit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';

export interface MenuItemProps {
    iconName: IconName;
    getLabel: () => string;
    getDescription?: () => string;
    badge?: React.ReactNode;
    onClick: () => void;
    onClose: () => void;
    rightElement?: React.ReactNode;
}

export const MenuItem = ({
    iconName,
    getLabel,
    getDescription,
    badge,
    onClick,
    onClose,
    rightElement,
}: MenuItemProps) => (
    <DropdownMenuButton
        onClick={() => {
            onClick();
            onClose();
        }}
        className="justify-start"
    >
        <div className="flex items-center gap-3 w-full">
            <Icon name={iconName} size={4} className="shrink-0" />
            <div className="flex flex-column flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{getLabel()}</span>
                    {badge}
                </div>
                {getDescription && <span className="text-xs color-hint text-left">{getDescription()}</span>}
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
    placement?: DropdownProps['originalPlacement'];
    children?: React.ReactNode;
}

export const MenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    className = '',
    width = '200px',
    placement = 'bottom-start',
    children,
}: MenuDropdownProps) => {
    return (
        <Dropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            originalPlacement={placement}
            size={{
                width: width as Unit,
            }}
            className={className}
        >
            {children}
        </Dropdown>
    );
};
