import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { useConversation } from '../../providers/ConversationProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversations } from '../../redux/selectors';
import { sortByDate } from '../../util/date';
import RecentChatsList from '../sidepanel/RecentChatsList';

interface FavoritesSidebarSectionProps {
    showText: boolean;
    onItemClick?: () => void;
}

export const FavoritesSidebarSection = ({ showText, onItemClick }: FavoritesSidebarSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const conversationMap = useLumoSelector(selectConversations);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();
    const { isGhostChatMode } = useGhostChat();
    const { isCollapsed, toggle } = useSidebar();

    const favorites = useMemo(() => {
        if (isGuest) return [];

        const conversations = Object.values(conversationMap).filter(
            (conversation) => !conversation.ghost && conversation.starred === true
        );

        return conversations.sort(sortByDate('desc'));
    }, [conversationMap, isGuest]);

    // Don't render section if no favorites
    if (favorites.length === 0 || isGuest || isGhostChatMode) {
        return null;
    }

    const handleHeaderClick = () => {
        if (isCollapsed) {
            toggle();
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className="sidebar-section favorites-sidebar-section">
            <Tooltip title={c('collider_2025:Title').t`Favorites`} originalPlacement="right">
                <button
                    className={clsx('sidebar-item', !showText && 'collapsed')}
                    onClick={handleHeaderClick}
                    aria-label={c('collider_2025:Title').t`Favorites`}
                    aria-expanded={isExpanded}
                >
                    <div className="sidebar-item-icon">
                        <Icon name="star" size={4} />
                    </div>
                    <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                        {c('collider_2025:Title').t`Favorites`}
                    </span>
                    {showText && (
                        <Icon
                            name="chevron-down"
                            size={3}
                            className={clsx('ml-auto transition-transform', !isExpanded && 'rotateZ-270')}
                        />
                    )}
                </button>
            </Tooltip>

            {!isCollapsed && isExpanded && (
                <div className="favorites-content ml-6">
                    <RecentChatsList
                        conversations={favorites}
                        selectedConversationId={conversationId}
                        onItemClick={onItemClick}
                    />
                </div>
            )}
        </div>
    );
};
