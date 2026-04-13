import type { FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';

import CoreHeader from '@proton/components/components/header/Header';
import type { HeaderProps } from '@proton/pass/components/Header/types';
import { MenuDropdown } from '@proton/pass/components/Menu/Dropdown/MenuDropdown';
import { MonitorHeader } from '@proton/pass/components/Monitor/MonitorHeader';

export const HeaderMonitor: FC<HeaderProps & RouteChildrenProps> = ({ onLock, onLogout, interactive, ...subRoute }) => {
    return (
        <CoreHeader className="border-bottom border-weak h-auto p-2">
            <div className="flex items-center gap-2">
                <MenuDropdown onLock={onLock} onLogout={onLogout} interactive={interactive} />
                <MonitorHeader {...subRoute} />
            </div>
        </CoreHeader>
    );
};
