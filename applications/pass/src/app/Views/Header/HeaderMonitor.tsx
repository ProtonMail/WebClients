import type { FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';

import type { HeaderProps } from 'proton-pass-web/app/Views/Header/types';

import CoreHeader from '@proton/components/components/header/Header';
import Hamburger from '@proton/components/components/sidebar/Hamburger';
import { MonitorHeader } from '@proton/pass/components/Monitor/MonitorHeader';

export const HeaderMonitor: FC<HeaderProps & RouteChildrenProps> = ({
    sidebarExpanded,
    sidebarToggle,
    ...subRoute
}) => (
    <CoreHeader className="border-bottom border-weak h-auto p-2">
        <div className="flex items-center gap-2">
            <Hamburger expanded={sidebarExpanded} onToggle={sidebarToggle} />
            <MonitorHeader {...subRoute} />
        </div>
    </CoreHeader>
);
