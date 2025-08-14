import { useRef } from 'react';

import { c } from 'ttag';

import { useSidebar } from '../../providers/SidebarProvider';
import { LumoSidebarButton as SidebarButton } from '../components/LumoSidebarButton';
import { ChatHistory } from '../sidepanel/ChatHistory';

export const SidebarContent = () => {
    const refInputSearch = useRef<HTMLInputElement>(null);

    const { isCollapsed, shouldShowContent, toggle, closeOnItemClick } = useSidebar();

    const handleSearchClick = () => {
        // Use toggle to show sidebar if hidden/collapsed, then focus search
        if (isCollapsed) {
            toggle(); // Will expand on large screens or show overlay on small screens
        }
        setTimeout(() => refInputSearch.current?.focus(), 100);
    };

    return (
        <div className="flex flex-1 flex-column flex-nowrap items-center justify-space-between">
            <div className="flex h-full flex-column gap-3 w-full px-3">
                {isCollapsed ? (
                    <>
                        <SidebarButton
                            title={c('collider_2025:Button').t`Search chats`}
                            iconName="magnifier"
                            onClick={handleSearchClick}
                        />
                        <SidebarButton
                            title={c('collider_2025:Button').t`Favorites`}
                            iconName="star"
                            onClick={toggle}
                        />
                        <SidebarButton
                            title={c('collider_2025:Button').t`History`}
                            iconName="clock-rotate-left"
                            onClick={toggle}
                        />
                    </>
                ) : shouldShowContent ? (
                    <ChatHistory refInputSearch={refInputSearch} onItemClick={closeOnItemClick} />
                ) : null}
                {/* {!isGuest && <WhatDoesLLMKnowComponent />} */}
            </div>
        </div>
    );
};
