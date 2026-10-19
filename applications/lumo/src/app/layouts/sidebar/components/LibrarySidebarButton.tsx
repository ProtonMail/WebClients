import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { SidebarItem } from './SidebarItem';

interface Props {
    onItemClick?: () => void;
}

export const LibrarySidebarButton = ({ onItemClick }: Props) => {
    const history = useHistory();
    const isActive = useRouteMatch('/library');

    const handleClick = () => {
        history.push('/library');
        onItemClick?.();
    };

    return (
        <SidebarItem
            icon="LibraryBig"
            label={c('collider_2025:Button').t`Library`}
            onClick={handleClick}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
