import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { SidebarItem } from './SidebarItem';

interface Props {
    onItemClick?: () => void;
}

export const CreationsSidebarButton = ({ onItemClick }: Props) => {
    const history = useHistory();
    const isActive = useRouteMatch('/creations');

    const handleClick = () => {
        history.push('/creations');
        onItemClick?.();
    };

    return (
        <SidebarItem
            icon="FileText"
            label={c('collider_2025:Button').t`Creations`}
            onClick={handleClick}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
