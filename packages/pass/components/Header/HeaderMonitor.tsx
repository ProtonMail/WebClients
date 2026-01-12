import type { FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import CoreHeader from '@proton/components/components/header/Header';
import Icon from '@proton/components/components/icon/Icon';
import type { HeaderProps } from '@proton/pass/components/Header/types';
import { MenuDropdown } from '@proton/pass/components/Menu/Dropdown/MenuDropdown';
import { MonitorHeader } from '@proton/pass/components/Monitor/MonitorHeader';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';

export const HeaderMonitor: FC<HeaderProps & RouteChildrenProps> = ({ onLock, onLogout, interactive, ...subRoute }) => {
    const navigate = useNavigate();

    return (
        <CoreHeader className="border-bottom border-weak h-auto p-2">
            <div className="flex items-center gap-2">
                <MenuDropdown onLock={onLock} onLogout={onLogout} interactive={interactive} />
                <Button
                    className="shrink-0"
                    size="small"
                    icon
                    pill
                    shape="solid"
                    onClick={() => navigate(getLocalPath())}
                >
                    <Icon className="modal-close-icon" name="arrow-left" size={3.5} alt={c('Action').t`Close`} />
                </Button>
                <MonitorHeader {...subRoute} />
            </div>
        </CoreHeader>
    );
};
