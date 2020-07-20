import React, { ReactNode } from 'react';

import Hamburger from './Hamburger';
import MainLogo from '../logo/MainLogo';
import MobileAppsLinks from './MobileAppsLinks';

interface Props {
    url?: string;
    expanded?: boolean;
    onToggleExpand?: () => void;
    mainLogo?: ReactNode;
    primary?: ReactNode;
    isNarrow?: boolean;
    children?: ReactNode;
    version?: ReactNode;
    hasAppLinks?: boolean;
}

const Sidebar = ({
    expanded = false,
    onToggleExpand,
    hasAppLinks = true,
    mainLogo,
    url = '',
    primary,
    children,
    version,
}: Props) => {
    return (
        <div className="sidebar flex flex-nowrap flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet flex-item-noshrink">
                <div className="flex flex-spacebetween flex-items-center pl1 pr1">
                    {mainLogo || <MainLogo url={url} />}
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            {primary ? <div className="nomobile pl1 pr1 pb1 flex-item-noshrink">{primary}</div> : null}
            <div className="onmobile-mt1" aria-hidden="true" />
            <div className="flex-item-fluid flex-nowrap flex flex-column scroll-if-needed customScrollBar-container pb1">
                {children}
            </div>
            {version}
            {hasAppLinks ? <MobileAppsLinks /> : null}
        </div>
    );
};

export default Sidebar;
