import React from 'react';

import Dropdown, { type DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { type DropdownSize, DropdownSizeUnit } from '@proton/components/components/dropdown/utils';

export interface MenuItemProps {
    icon?: React.ReactNode;
    getLabel: () => string;
    getDescription?: () => string;
    badge?: React.ReactNode;
    onClick: () => void;
    onClose: () => void;
    rightElement?: React.ReactNode;
}

export const MenuItem = ({ icon, getLabel, getDescription, badge, onClick, onClose, rightElement }: MenuItemProps) => (
    <DropdownMenuButton
        onClick={() => {
            onClick();
            onClose();
        }}
        className="justify-start"
    >
        <div className="flex items-center gap-3 w-full">
            {icon && <span className="shrink-0 flex">{icon}</span>}
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
    autoClose?: DropdownProps['autoClose'];
    size?: DropdownSize;
    children?: React.ReactNode;
}

export const MenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    className = '',
    placement = 'bottom-start',
    autoClose = true,
    size = {
        width: DropdownSizeUnit.Dynamic,
        height: DropdownSizeUnit.Dynamic,
    },
    children,
}: MenuDropdownProps) => {
    return (
        <Dropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            originalPlacement={placement}
            className={className}
            autoClose={autoClose}
            size={size}
        >
            {children}
        </Dropdown>
    );
};
