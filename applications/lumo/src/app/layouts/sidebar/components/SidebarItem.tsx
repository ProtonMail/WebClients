import type { ComponentType } from 'react';

import { clsx } from 'clsx';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import type { IconSize } from '@proton/icons/types';

export interface SidebarItemProps {
    icon: ComponentType<{ size?: IconSize; className?: string }>;
    label: string;
    onClick: () => void;
    className?: string;
    shortcut?: string;
    showShortcutOnHover?: boolean;
    disabled?: boolean;
}

export const SidebarItem = ({
    icon: IconComponent,
    label,
    onClick,
    className,
    shortcut,
    showShortcutOnHover,
    disabled = false,
}: SidebarItemProps) => (
    <button
        className={clsx(
            'sidebar-item flex items-center w-full cursor-pointer py-2 px-1.5',
            className,
            showShortcutOnHover && 'show-shortcut-on-hover'
        )}
        onClick={onClick}
        aria-label={label}
        disabled={disabled}
    >
        <div className="sidebar-item-icon flex items-center justify-center shrink-0 mr-1.5">
            <IconComponent size={4} className="rtl:mirror" />
        </div>
        <span className="sidebar-item-text flex-1 flex items-center justify-space-between text-nowrap overflow-hidden gap-2">
            <span className="sidebar-item-label">{label}</span>
            {shortcut && (
                <span className="sidebar-item-shortcut shrink-0 ml-auto">
                    <Kbd shortcut={shortcut} />
                </span>
            )}
        </span>
    </button>
);
