import { useMemo } from 'react';

import { c } from 'ttag';

import { IcStar } from '@proton/icons/icons/IcStar';

import { useConversation } from '../../providers/ConversationProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversations } from '../../redux/selectors';
import { sortByDate } from '../../util/date';
import RecentChatsList from '../sidepanel/RecentChatsList';
import { CollapsibleSidebarSection } from './components/CollapsibleSidebarSection';

interface FavoritesSidebarSectionProps {
    showText: boolean;
    onItemClick?: () => void;
}

export const FavoritesSidebarSection = ({ showText, onItemClick }: FavoritesSidebarSectionProps) => {
    const conversationMap = useLumoSelector(selectConversations);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();
    const { isGhostChatMode } = useGhostChat();

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

    return (
        <CollapsibleSidebarSection
            label={c('collider_2025:Title').t`Favorites`}
            icon={<IcStar size={4} />}
            showText={showText}
            className="favorites-sidebar-section"
        >
            <div className="favorites-content ml-4">
                <RecentChatsList
                    conversations={favorites}
                    selectedConversationId={conversationId}
                    onItemClick={onItemClick}
                />
            </div>
        </CollapsibleSidebarSection>
    );
};
