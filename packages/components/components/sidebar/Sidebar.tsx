import React, { ReactNode } from 'react';

import Hamburger from './Hamburger';
import MainLogo from '../logo/MainLogo';
import MobileAppsLinks from './MobileAppsLinks';
import NavMenu from './NavMenu';

interface Props {
    list: any[];
    url: string;
    expanded: boolean;
    onToggleExpand: () => void;
    children?: ReactNode;
    version?: ReactNode;
}

const Sidebar = ({ expanded = false, onToggleExpand, list = [], url = '', children, version }: Props) => {
    return (
        <div className="sidebar flex flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet flex-item-noshrink">
                <div className="flex flex-spacebetween flex-items-center pl1 pr1">
                    <MainLogo url={url} />
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            {children}
            <nav className="navigation mw100 flex-item-fluid scroll-if-needed customScrollBar-container mb1">
                <NavMenu list={list} />
            </nav>
            {version}
            <MobileAppsLinks />
        </div>
    );
};

export default Sidebar;
