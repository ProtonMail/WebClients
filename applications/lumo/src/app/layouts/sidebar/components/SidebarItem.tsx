import { clsx } from 'clsx';

import { Kbd } from '@proton/atoms/Kbd/Kbd';

import { type IconName, LumoIcon } from '../../../components/LumoIcon/LumoIcon';

export interface SidebarItemProps {
    icon: IconName;
    label: string;
    onClick: () => void;
    className?: string;
    shortcut?: string;
    showShortcutOnHover?: boolean;
    disabled?: boolean;
}

export const SidebarItem = ({
    icon,
    label,
    onClick,
    className,
    shortcut,
    showShortcutOnHover,
    disabled = false,
}: SidebarItemProps) => (
    <button
        className={clsx(
            'sidebar-item flex items-center gap-3 w-full px-3 radius-12 cursor-pointer',
            className,
            showShortcutOnHover && 'show-shortcut-on-hover'
        )}
        onClick={onClick}
        aria-label={label}
        disabled={disabled}
    >
        <div className="sidebar-item-icon flex items-center justify-start shrink-0">
            <LumoIcon name={icon} size={18} className="rtl:mirror" />
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
