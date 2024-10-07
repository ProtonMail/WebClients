import { useEffect, useState } from 'react';

import useDrawer from '@proton/components/hooks/drawer/useDrawer';

const useDrawerWidth = () => {
    const [sidebarWidth, setSidebarWidth] = useState(0);
    const [appWidth, setAppWidth] = useState(0);
    const { showDrawerSidebar, drawerSidebarMounted, appInView } = useDrawer();

    useEffect(() => {
        if (!showDrawerSidebar || !drawerSidebarMounted) {
            setSidebarWidth(0);
            return;
        }
        const sidebarElement = window.document.querySelector('.drawer-sidebar');

        if (!sidebarElement) {
            return;
        }

        const sidebarResizeObserver = new ResizeObserver((entries) => {
            setSidebarWidth(entries[0].contentRect.width);
        });

        // Only checks iframe root div widths changes (window resize or inner resize when column mailbox layout is set)
        sidebarResizeObserver.observe(sidebarElement);

        return () => {
            sidebarResizeObserver.disconnect();
        };
    }, [showDrawerSidebar, drawerSidebarMounted]);

    useEffect(() => {
        if (!appInView) {
            setAppWidth(0);
        }

        const appElement = window.document.querySelector('.drawer-app');

        if (!appElement) {
            return;
        }

        const appResizeObserver = new ResizeObserver((entries) => {
            setAppWidth(entries[0].contentRect.width);
        });

        appResizeObserver.observe(appElement);

        return () => {
            appResizeObserver.disconnect();
        };
    }, [appInView]);

    return appWidth + sidebarWidth;
};

export default useDrawerWidth;
