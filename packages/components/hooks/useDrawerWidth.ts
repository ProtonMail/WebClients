import { useEffect, useState } from 'react';

import { useDrawer } from '@proton/components/hooks/index';

export const useDrawerWidth = () => {
    const [sidebarWidth, setSidebarWidth] = useState(0);
    const [appWidth, setAppWidth] = useState(0);
    const { showDrawerSidebar, drawerSidebarMounted } = useDrawer();

    useEffect(() => {
        if (!showDrawerSidebar || !drawerSidebarMounted) {
            setSidebarWidth(0);
            setAppWidth(0);
            return;
        }
        const sidebarElement = window.document.querySelector('.drawer-sidebar');
        const appElement = window.document.querySelector('.drawer-app');

        if (!sidebarElement || !appElement) {
            return;
        }

        const sidebarResizeObserver = new ResizeObserver((entries) => {
            setSidebarWidth(entries[0].contentRect.width);
        });

        const appResizeObserver = new ResizeObserver((entries) => {
            setAppWidth(entries[0].contentRect.width);
        });

        // Only checks iframe root div widths changes (window resize or inner resize when column mailbox layout is set)
        sidebarResizeObserver.observe(sidebarElement);
        appResizeObserver.observe(appElement);

        return () => {
            sidebarResizeObserver.disconnect();
            appResizeObserver.disconnect();
        };
    }, [showDrawerSidebar, drawerSidebarMounted]);

    return appWidth + sidebarWidth;
};
