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
    const match = useRouteMatch(pathname);
    const isExactMatch = match?.isExact ?? false;

    const handleClick = useCallback(() => {
        if (!isExactMatch) {
            history.push(pathname);
        }
        onItemClick();
    }, [history, isExactMatch, onItemClick, pathname]);

    return (
        <SidebarItem
            icon={icon}
            label={label}
            onClick={handleClick}
            className={match ? 'sidebar-item--active' : undefined}
        />
    );
};
