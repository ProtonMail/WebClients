import { useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { useGhostChat } from '../../../providers/GhostChatProvider';
import { SidebarItem } from './SidebarItem';

export const NewGhostChatButton = () => {
    const { isGhostChatMode, setGhostChatMode } = useGhostChat();
    const isInMainComponent = useRouteMatch('/')?.isExact;
    const history = useHistory();

    const handleNewGhostChat = useCallback(() => {
        if (!isInMainComponent) {
            history.push('/');
        }
        setGhostChatMode(true);
    }, [isInMainComponent, setGhostChatMode, history]);

    return (
        <SidebarItem
            icon="cross-circle"
            label={c('collider_2025: Action').t`New ghost chat`}
            onClick={handleNewGhostChat}
            disabled={isGhostChatMode}
        />
    );
};
