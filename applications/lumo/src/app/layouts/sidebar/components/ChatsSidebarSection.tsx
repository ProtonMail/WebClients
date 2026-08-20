import { memo, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { ChatHistoryLoadingSkeleton } from '../../../components/ChatHistoryLoadingSkeleton';
import { useLumoUserSettings } from '../../../hooks';
import { useIsChatHistoryHydrating } from '../../../hooks/useIsChatHistoryHydrating';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
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

    const retainedFavorites = useMemo(() => {
        return applyRetentionPolicy(favorites, hasLumoPlus);
    }, [favorites, hasLumoPlus]);

    const { filteredHistoryRows, visibleHistoryRows, showSeeMore } = useMemo(() => {
        const projectFilteredRows = showProjectConversationsInHistory
            ? conversationRows
            : conversationRows.filter((row) => {
                  const space = row.spaceId ? spaceMap[row.spaceId] : undefined;
                  return space?.isProject !== true;
              });

        const retainedRows = applyRetentionPolicy(projectFilteredRows, hasLumoPlus);

        const historySlots = Math.max(0, SIDEBAR_CHAT_TOTAL_LIMIT - retainedFavorites.length);

        return {
            filteredHistoryRows: retainedRows,
            visibleHistoryRows: retainedRows.slice(0, historySlots),
            showSeeMore: retainedRows.length > historySlots,
        };
    }, [conversationRows, retainedFavorites.length, spaceMap, showProjectConversationsInHistory, hasLumoPlus]);

    return (
        <div className="chats-sidebar-section flex flex-column min-w-0 gap-2">
            <CollapsibleSidebarSection
                label={c('collider_2025:Title').t`Favorites`}
                className="favorites-sidebar-section"
            >
                {retainedFavorites.length === 0 ? (
                    <div className="color-weak text-sm px-1.5 py-1">
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
            >
                {filteredHistoryRows.length === 0 ? (
                    <div className="color-weak text-sm px-1.5 py-1">
                        {c('collider_2025:Title').t`No chat history yet. Let's start chatting!`}
                    </div>
                ) : (
                    <div className="chat-history-list">
                        <ul className="unstyled flex flex-column flex-nowrap gap-0.5 min-w-0 w-full my-0">
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
                                className="block text-sm color-weak px-1.5 py-2 text-center text-no-decoration hover:color-norm"
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
