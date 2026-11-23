import React from 'react';

import { clsx } from 'clsx';

import { LumoLink } from '../../../components/Links/LumoLink';
import { AttentionDot } from '../../../components/StatusDot/AttentionDot';
import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';

interface SidebarNavItem {
    id: string;
    to: string;
    label: string;
    isSelected: boolean;
    leadingContent?: React.ReactNode;
    trailingContent?: React.ReactNode;
    trailingLabel?: React.ReactNode;
    /** Set when a chat of this item waits on the user. */
    attentionKey?: string;
}

interface SidebarNavListProps {
    items: SidebarNavItem[];
    onItemClick?: () => void;
}

export const SidebarNavList = ({ items, onItemClick }: SidebarNavListProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const isTouchDevice = useIsTouchDevice();
    // Matches when DropdownMenu keeps its ⋯ button visible instead of showing it on hover.
    const alwaysShowsTrailingContent = isSmallScreen || isTouchDevice;

    return (
        <ul className="unstyled flex flex-column flex-nowrap min-w-0 w-full my-0">
            {items.map(
                ({ id, to, label, isSelected, leadingContent, trailingContent, trailingLabel, attentionKey }) => (
                    <li
                        key={id}
                        className={clsx(
                            'relative group-hover-hide-container group-hover-opacity-container',
                            'flex items-center min-w-0 overflow-hidden navigation-link w-full',
                            'radius-12 lumo-body-medium transition-colors',
                            isSelected && 'is-active'
                        )}
                    >
                        <LumoLink
                            to={to}
                            className={clsx(
                                'absolute inset-0 flex flex-nowrap items-center gap-2 pl-3',
                                trailingContent ? 'pr-8' : 'pr-3'
                            )}
                            onClick={onItemClick}
                        >
                            {leadingContent}
                            <span className="sidebar-nav-list--label text-ellipsis flex-1 min-w-0" title={label}>
                                {label}
                            </span>
                            {trailingLabel}
                            {attentionKey && (
                                <AttentionDot
                                    attentionKey={attentionKey}
                                    className={
                                        trailingContent && !alwaysShowsTrailingContent
                                            ? 'sidebar-status-dot-slot group-hover:hidden'
                                            : undefined
                                    }
                                />
                            )}
                        </LumoLink>
                        {trailingContent && (
                            <div className="relative z-1 ml-auto pl-1 flex-shrink-0">{trailingContent}</div>
                        )}
                    </li>
                )
            )}
        </ul>
    );
};
