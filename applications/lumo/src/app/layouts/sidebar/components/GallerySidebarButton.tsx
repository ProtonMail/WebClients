import { useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { IcImage } from '@proton/icons/icons/IcImage';

import { SidebarItem } from './SidebarItem';

interface Props {
    onItemClick: () => void;
}

export const GallerySidebarButton = ({ onItemClick }: Props) => {
    const history = useHistory();
    const isActive = useRouteMatch('/gallery');

    const handleClick = useCallback(() => {
        history.push('/gallery');
        onItemClick();
    }, [history, onItemClick]);

    return (
        <SidebarItem
            icon={IcImage}
            label={c('collider_2025:Button').t`Gallery`}
            onClick={handleClick}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
