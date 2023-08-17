import { ReactElement, cloneElement, useEffect } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useDrawer } from '../../hooks';

import './DrawerSidebar.scss';

interface Props {
    buttons: ReactElement[];
}

const DrawerSidebar = ({ buttons }: Props) => {
    const { appInView, setDrawerSidebarMounted, showDrawerSidebar } = useDrawer();
    const hasSidebar = buttons.length > 0;

    useEffect(() => {
        setDrawerSidebarMounted(true);
    }, []);

    useEffect(() => {
        setDrawerSidebarMounted(true);
    }, []);

    if (!hasSidebar || !showDrawerSidebar) {
        return null;
    }

    // Adding keys to buttons
    const clonedButtons = buttons.map((button, index) =>
        cloneElement(button, { key: button.key || `sidebar-button-${index}`, style: { '--index': index } })
    );

    return (
        <nav
            aria-label={c('Landmarks').t`Side panel`}
            className={clsx('drawer-sidebar no-mobile no-print', appInView && 'drawer-sidebar--hide-on-tablet')}
        >
            <span className="flex flex-column flex-align-items-center py-3 h100">
                <div className="flex flex-column flex-align-items-center gap-5">{clonedButtons}</div>
            </span>
        </nav>
    );
};

export default DrawerSidebar;
