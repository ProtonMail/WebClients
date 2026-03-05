import React from 'react';

import { clsx } from 'clsx';

import { LumoLink } from '../../../components/Links/LumoLink';

export interface SidebarNavItem {
    id: string;
    to: string;
    label: string;
    isSelected: boolean;
    leadingContent?: React.ReactNode;
    trailingContent?: React.ReactNode;
}

interface SidebarNavListProps {
    items: SidebarNavItem[];
    onItemClick?: () => void;
}

export const SidebarNavList = ({ items, onItemClick }: SidebarNavListProps) => (
    <ul className="unstyled flex flex-column flex-nowrap gap-0.5 shrink-0 pl-1 my-0">
        {items.map(({ id, to, label, isSelected, leadingContent, trailingContent }) => (
            <li
                key={id}
                className={clsx(
                    'relative group-hover-hide-container group-hover-opacity-container',
                    'flex items-center shrink-0 navigation-link w-full',
                    'hover:bg-weak rounded-md transition-colors text-sm',
                    isSelected && 'is-active'
                )}
            >
                <LumoLink
                    to={to}
                    className={clsx(
                        'absolute inset-0 flex items-center gap-2 pl-2 hover:text-primary',
                        trailingContent ? 'pr-8' : 'pr-2',
                        isSelected && 'text-semibold'
                    )}
                    onClick={onItemClick}
                >
                    {leadingContent}
                    <span className="text-ellipsis flex-1" title={label}>
                        {label}
                    </span>
                </LumoLink>
                {trailingContent && <div className="relative z-1 ml-auto pl-1 flex-shrink-0">{trailingContent}</div>}
            </li>
        ))}
    </ul>
);
