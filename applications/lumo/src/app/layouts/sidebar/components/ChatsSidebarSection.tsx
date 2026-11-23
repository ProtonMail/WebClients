import { memo, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { ChatHistoryLoadingSkeleton } from '../../../components/ChatHistoryLoadingSkeleton';
import { useLumoUserSettings } from '../../../hooks';
import { useIsChatHistoryHydrating } from '../../../hooks/useIsChatHistoryHydrating';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { getGroupAttentionKey, useAttentionKeys } from '../../../providers/ConversationAttentionProvider';
import { useConversation } from '../../../providers/ConversationProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useSidebar } from '../../../providers/SidebarProvider';
import { useLumoMemoSelector, useLumoSelector } from '../../../redux/hooks';
import {
    historyRowsEqual,
    selectConversationById,
    selectHistoryConversationRows,
    selectStarredConversationsSorted,
} from '../../../redux/selectors';
import { selectSpaceMap } from '../../../redux/slices/core/spaces';
import { SpaceType } from '../../../types';
import { ChatHistoryGroupByMenu } from '../../sidepanel/ChatHistoryGroupByMenu';
import RecentChatsList, { ConversationListItem } from '../../sidepanel/RecentChatsList';
import { applyRetentionPolicy } from '../../sidepanel/helpers';
import { SIDEBAR_CHAT_TOTAL_LIMIT } from '../constants';
import { CollapsibleSidebarSection } from './CollapsibleSidebarSection';

interface ConnectedItemProps {
    id: string;
    isSelected: boolean;
    onItemClick?: () => void;
}

const ConnectedConversationListItem = memo(({ id, isSelected, onItemClick }: ConnectedItemProps) => {
    const conversation = useLumoMemoSelector(selectConversationById, [id]);

    if (!conversation) {
        return null;
    }

    return (
        <ConversationListItem
            conversation={conversation}
            isSelected={isSelected}
            showDropdown
            onItemClick={onItemClick}
        />
    );
});

ConnectedConversationListItem.displayName = 'ConnectedConversationListItem';

interface ChatsSidebarSectionInnerProps {
    onItemClick?: () => void;
}

const ChatsSidebarSectionInner = ({ onItemClick }: ChatsSidebarSectionInnerProps) => {
    const favorites = useLumoSelector(selectStarredConversationsSorted, shallowEqual);
    const conversationRows = useLumoSelector(selectHistoryConversationRows, historyRowsEqual);
    const spaceMap = useLumoSelector(selectSpaceMap, shallowEqual);
    const { conversationId } = useConversation();
    const { hasLumoPlus } = useLumoPlan();
    const { lumoUserSettings } = useLumoUserSettings();
    const showProjectConversationsInHistory = lumoUserSettings.showProjectConversationsInHistory ?? false;
    const { byConversation: attentionByConversation } = useAttentionKeys();

    const retainedFavorites = useMemo(() => {
        return applyRetentionPolicy(favorites, hasLumoPlus);
    }, [favorites, hasLumoPlus]);

    const filteredHistoryRows = useMemo(() => {
        const filteredRows = conversationRows.filter((row) => {
            const space = row.spaceId ? spaceMap[row.spaceId] : undefined;
            return (
                space?.spaceType !== SpaceType.Schedule &&
                (showProjectConversationsInHistory || space?.spaceType !== SpaceType.Project)
            );
        });

        return applyRetentionPolicy(filteredRows, hasLumoPlus);
    }, [conversationRows, spaceMap, showProjectConversationsInHistory, hasLumoPlus]);

    const historySlots = Math.max(0, SIDEBAR_CHAT_TOTAL_LIMIT - retainedFavorites.length);
    const visibleHistoryRows = filteredHistoryRows.filter(
        (row, index) => index < historySlots || attentionByConversation.has(row.id)
    );
    const showSeeMore = filteredHistoryRows.length > historySlots;
    const favoritesAttentionKey = getGroupAttentionKey(
        retainedFavorites.map((conversation) => attentionByConversation.get(conversation.id))
    );
    const historyAttentionKey = getGroupAttentionKey(
        visibleHistoryRows.map((row) => attentionByConversation.get(row.id))
    );

    return (
        <div className="chats-sidebar-section flex flex-column min-w-0">
            <CollapsibleSidebarSection
                label={c('collider_2025:Title').t`Favorites`}
                className="favorites-sidebar-section"
                attentionKey={favoritesAttentionKey}
            >
                {retainedFavorites.length === 0 ? (
                    <div className="px-3 py-2 lumo-body-medium lumo-color-glyph-mid">
                        {c('collider_2025:Info').t`No favorites yet. Star a chat to find it here quickly.`}
                    </div>
                ) : (
                    <div className="chat-history-list">
                        <RecentChatsList
                            conversations={retainedFavorites}
                            selectedConversationId={conversationId}
                            onItemClick={onItemClick}
                        />
                    </div>
                )}
            </CollapsibleSidebarSection>

            <CollapsibleSidebarSection
                label={c('collider_2025:Title').t`Recent`}
                className="chat-history-sidebar-section"
                actionButton={<ChatHistoryGroupByMenu />}
                attentionKey={historyAttentionKey}
            >
                {filteredHistoryRows.length === 0 ? (
                    <div className="px-3 py-2 lumo-body-medium lumo-color-glyph-mid">
                        {c('collider_2025:Title').t`No chat history yet. Let's start chatting!`}
                    </div>
                ) : (
                    <div className="chat-history-list">
                        <ul className="unstyled flex flex-column flex-nowrap min-w-0 w-full my-0">
                            {visibleHistoryRows.map((row) => (
                                <ConnectedConversationListItem
                                    key={row.id}
                                    id={row.id}
                                    isSelected={row.id === conversationId}
                                    onItemClick={onItemClick}
                                />
                            ))}
                        </ul>
                        {showSeeMore && (
                            <Link
                                to="/chats"
                                className="lumo-sidebar-section-more block px-3 py-2 lumo-body-medium text-center text-no-decoration lumo-color-glyph-mid"
                                onClick={onItemClick}
                            >
                                {c('collider_2025:Button').t`All chats`}
                            </Link>
                        )}
                    </div>
                )}
            </CollapsibleSidebarSection>
        </div>
    );
};

interface ChatsSidebarSectionProps {
    onItemClick?: () => void;
}

export const ChatsSidebarSection = ({ onItemClick }: ChatsSidebarSectionProps) => {
    const isChatHistoryHydrating = useIsChatHistoryHydrating();
    const isGuest = useIsGuest();
    const { closeOnItemClick } = useSidebar();

    if (isGuest) {
        return null;
    }

    const handleItemClick = onItemClick ?? closeOnItemClick;

    if (isChatHistoryHydrating) {
        return <ChatHistoryLoadingSkeleton />;
    }

    return <ChatsSidebarSectionInner onItemClick={handleItemClick} />;
};
