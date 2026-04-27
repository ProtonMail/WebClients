import { useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { SidebarItem } from './SidebarItem';

interface Props {
    showText: boolean;
    onItemClick: () => void;
}

export const GallerySidebarButton = ({ showText, onItemClick }: Props) => {
    const history = useHistory();
    const isActive = useRouteMatch('/gallery');

    const handleClick = useCallback(() => {
        history.push('/gallery');
        onItemClick();
    }, [history, onItemClick]);

    return (
        <SidebarItem
            icon="image"
            label={c('collider_2025:Button').t`Gallery`}
            onClick={handleClick}
            showText={showText}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
