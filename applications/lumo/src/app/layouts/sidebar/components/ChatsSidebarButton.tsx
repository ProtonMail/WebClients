import { useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { SidebarItem } from './SidebarItem';

interface Props {
    onItemClick: () => void;
}

export const ChatsSidebarButton = ({ onItemClick }: Props) => {
    const history = useHistory();
    const isActive = useRouteMatch('/chats');

    const handleClick = useCallback(() => {
        history.push('/chats');
        onItemClick();
    }, [history, onItemClick]);

    return (
        <SidebarItem
            icon="MessagesSquare"
            label={c('collider_2025:Button').t`All chats`}
            onClick={handleClick}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
