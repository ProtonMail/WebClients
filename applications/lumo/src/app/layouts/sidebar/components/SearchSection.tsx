import { useCallback } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';
import { metaKey } from '@proton/shared/lib/helpers/browser';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';

interface Props {
    showText: boolean;
    value: string;
    onChange: (value: string) => void;
    onSearchClick: () => void;
    isSmallScreen: boolean;
}

export const SearchSection = ({ showText, value, onChange, onSearchClick, isSmallScreen }: Props) => {
    const { isCollapsed, toggle } = useSidebar();
    const isGuest = useIsGuest();

    const placeholder = isGuest
        ? c('collider_2025:Placeholder').t`Sign in required`
        : c('collider_2025:Placeholder').t`Search chats`;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleSearchClick = useCallback(() => {
        if (isCollapsed) {
            toggle();
        }
        onSearchClick();
    }, [isCollapsed, toggle, onSearchClick]);

    return (
        <div className="search-section">
            <Tooltip title={isCollapsed ? c('collider_2025:Button').t`Search` : undefined} originalPlacement="right">
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div className={clsx('search-container', isCollapsed && 'collapsed')} onClick={handleSearchClick}>
                    <div className="sidebar-item-icon">
                        <Icon name="magnifier" size={4} />
                    </div>
                    <div className={clsx('search-input-wrapper', !showText && 'hidden')}>
                        <input
                            type="text"
                            className="sidebar-search-input"
                            placeholder={placeholder}
                            value={value}
                            onChange={handleSearchChange}
                            readOnly={isCollapsed || isGuest}
                            tabIndex={isCollapsed || isGuest ? -1 : 0}
                            disabled={isGuest}
                        />
                        {showText && !isGuest && !isSmallScreen && (
                            <span className="search-shortcut">
                                <Kbd shortcut={`${metaKey}+K`} />
                            </span>
                        )}
                    </div>
                </div>
            </Tooltip>
        </div>
    );
};
