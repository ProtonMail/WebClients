import { useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import { SidebarItem } from './SidebarItem';

interface SidebarRouteButtonProps {
    icon: IconName;
    label: string;
    onItemClick: () => void;
    pathname: string;
}

export const SidebarRouteButton = ({ icon, label, onItemClick, pathname }: SidebarRouteButtonProps) => {
    const history = useHistory();
    const isActive = !!useRouteMatch(pathname);

    const handleClick = useCallback(() => {
        if (!isActive) {
            history.push(pathname);
        }
        onItemClick();
    }, [history, isActive, onItemClick, pathname]);

    return (
        <SidebarItem
            icon={icon}
            label={label}
            onClick={handleClick}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
