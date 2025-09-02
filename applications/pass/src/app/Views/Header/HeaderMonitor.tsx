import type { FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';

import type { HeaderProps } from 'proton-pass-web/app/Views/Header/types';

import { Header as CoreHeader, Hamburger } from '@proton/components';
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
