import { memo } from 'react';

import clsx from 'clsx';

import { SidebarList, SidebarNav } from '@proton/components';

import { APP_NAME } from '../../config';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import GuestDisclaimer from '../components/GuestDisclaimer';
import LumoSidebarComponent from '../components/LumoSidebarComponent/LumoSidebarComponent';
import { BasicSidebarListItems } from './BasicSidebarListItems';
import NewChatButtonSidebar from './NewChatButton';
import { SidebarContent } from './SidebarContent';

const LumoSidebarContent = () => {
    const { isCollapsed, isVisible, isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();

    // Don't render if sidebar is hidden
    if (!isVisible) {
        return null;
    }

    return (
        <>
            <SidebarNav className="flex flex-column flex-nowrap gap-3">
                <SidebarList className="flex flex-column flex-nowrap w-full flex-auto">
                    <NewChatButtonSidebar isCollapsed={isCollapsed} isSmallScreen={isSmallScreen} />
                    <SidebarContent />
                </SidebarList>
                <BasicSidebarListItems />
                {isGuest && isSmallScreen && <GuestDisclaimer />}
            </SidebarNav>
        </>
    );
};

const LumoSidebar = () => {
    const isGuest = useIsGuest();
    const { isCollapsed, isOverlay, toggle } = useSidebar();

    return (
        <LumoSidebarComponent
            collapsed={isCollapsed}
            expanded={isOverlay}
            onToggleExpand={toggle}
            app={APP_NAME}
            isGuest={isGuest}
            className={clsx(isOverlay && 'sidebar-expanded')}
        >
            <LumoSidebarContent />
        </LumoSidebarComponent>
    );
};

export default memo(LumoSidebar);
