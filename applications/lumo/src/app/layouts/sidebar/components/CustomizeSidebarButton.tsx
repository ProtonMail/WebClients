import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { SidebarItem } from './SidebarItem';

interface Props {
    onItemClick?: () => void;
}

export const CustomizeSidebarButton = ({ onItemClick }: Props) => {
    const history = useHistory();
    const isActive = useRouteMatch('/customize');

    const handleClick = () => {
        history.push('/customize');
        onItemClick?.();
    };

    return (
        <SidebarItem
            icon="Toolbox"
            label={c('collider_2025:Button').t`Customize`}
            onClick={handleClick}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
