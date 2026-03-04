import React from 'react';

import { clsx } from 'clsx';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';

export interface SidebarItemProps {
    icon: string;
    label: string;
    onClick: () => void;
    showText: boolean;
    className?: string;
    shortcut?: string;
    showShortcutOnHover?: boolean;
    iconSVG?: React.ReactNode | null;
    disabled?: boolean;
}

export const SidebarItem = ({
    icon,
    label,
    onClick,
    showText,
    className,
    shortcut,
    showShortcutOnHover,
    iconSVG = null,
    disabled = false,
}: SidebarItemProps) => (
    <Tooltip title={label} originalPlacement="right">
        <button
            className={clsx('sidebar-item', className, showShortcutOnHover && 'show-shortcut-on-hover')}
            onClick={onClick}
            aria-label={label}
            disabled={disabled}
        >
            <div className="sidebar-item-icon">
                {iconSVG ? iconSVG : <Icon name={icon as any} size={4} className="rtl:mirror" />}
            </div>
            <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                <span className="sidebar-item-label">{label}</span>
                {shortcut && showText && (
                    <span className="sidebar-item-shortcut">
                        <Kbd shortcut={shortcut} />
                    </span>
                )}
            </span>
        </button>
    </Tooltip>
);
