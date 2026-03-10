import { useDrawer, useDrawerWidth } from '@proton/components';

import './FloatingElements.scss';

export const FloatingElements = ({ children }: { children: React.ReactNode }) => {
    const drawerWidth = useDrawerWidth();
    const { showDrawerSidebar } = useDrawer();

    // When the drawer is collapsed, a chevron button is visible to expand it — offset by its width to avoid overlap.
    const drawerChevronWidth = 30;
    const rightOffset = showDrawerSidebar ? drawerWidth : drawerChevronWidth;

    return (
        <div
            className="floating-elements flex fixed bottom-0 flex-column w-full items-end right-custom max-w-custom"
            style={{
                '--right-custom': `${rightOffset}px`,
                '--max-w-custom': '50em',
            }}
        >
            {children}
        </div>
    );
};
