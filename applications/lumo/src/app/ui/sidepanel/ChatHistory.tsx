import { useMemo } from 'react';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms';
import { Icon } from '@proton/components';

import { useLumoCommon } from '../../hooks/useLumoCommon';
import { useConversation } from '../../providers/ConversationProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversations } from '../../redux/selectors';
import { sortByDate } from '../../util/date';
import ChatHistorySkeleton from '../components/ChatHistorySkeleton';
import {
    ChatHistoryFreeUserUpsell,
    ChatHistoryGuestUserUpsell,
} from '../components/ChatHistoryUpsell.tsx/ChatHistoryUpsell';
import RecentChatsList from './RecentChatsList';
import { categorizeConversations, searchConversations } from './helpers';

interface Props {
    refInputSearch: React.RefObject<HTMLInputElement>;
    onItemClick?: () => void;
    searchInput?: string; // External search input value
}

/**
 * Filters conversations based on user type and ghost chat mode
 */
const getVisibleConversations = (
    conversationMap: Record<string, any>,
    isGuest: boolean,
    isGhostChatMode: boolean,
    conversationId?: string
) => {
    // Guest users in ghost chat mode see no conversations
    if (isGuest && isGhostChatMode) {
        return [];
    }

    // Guest users not in ghost chat mode see only their active conversation
    if (isGuest) {
        const activeConversation = conversationId && conversationMap[conversationId];
        return activeConversation ? [activeConversation] : [];
    }

    // Regular users see all non-ghost conversations
    return Object.values(conversationMap).filter((conversation) => !conversation.ghost);
};

export const ChatHistory = ({ refInputSearch, onItemClick, searchInput = '' }: Props) => {
    const conversationMap = useLumoSelector(selectConversations);
    const { conversationId } = useConversation(); //switch to using react-router-dom parameters
    const { isGuest, isLumoPaid } = useLumoCommon();
    const { isGhostChatMode } = useGhostChat();
    const { isSmallScreen } = useSidebar();

    // Only show loading state during initial data fetch
    // const isLoading = !isGuest && !persistence.ready;
    const isLoading = false; // fixme is this correct?

    const { favorites, categorizedConversations, noConversationAtAll, noSearchMatch } = useMemo(() => {
        const conversations = getVisibleConversations(conversationMap, isGuest, isGhostChatMode, conversationId);

        const sortedConversations = conversations.sort(sortByDate('desc'));
        const allFavorites = sortedConversations.filter((conversation) => conversation.starred === true);
        const favorites = searchConversations(allFavorites, searchInput); // Apply search filter to favorites
        const filteredConversations = searchConversations(sortedConversations, searchInput);
        const categorizedConversations = categorizeConversations(filteredConversations);

        return {
            favorites,
            categorizedConversations,
            noConversationAtAll: sortedConversations.length === 0,
            noSearchMatch: filteredConversations.length === 0 && sortedConversations.length > 0,
        };
    }, [conversationMap, searchInput, isGuest, conversationId, isGhostChatMode]);

    const { today, lastWeek, lastMonth, earlier } = categorizedConversations;

    if (isLoading) {
        return <ChatHistorySkeleton />;
    }

    return (
        <div className="h-full w-full flex flex-column flex-nowrap gap-2">
            {/* Show Favorites section - include starred conversations in search results */}
            {favorites.length > 0 && (
                <>
                    <div className="sidebar-section-header">
                        <Icon name="star" size={4} />
                        <span>{c('collider_2025:Title').t`Favorites`}</span>
                    </div>
                    <div className="max-h-custom overflow-y-auto" style={{ '--max-h-custom': '20%' }}>
                        <RecentChatsList
                            conversations={favorites}
                            selectedConversationId={conversationId}
                            onItemClick={onItemClick}
                        />
                    </div>
                </>
            )}
            
            <Scroll className="flex-1">
                {/* History section header - hide for mobile guests to keep UI clean, but show when searching */}
                {(searchInput || !(isSmallScreen && isGuest)) && (
                    <div className="sidebar-section-header">
                        <Icon name="clock-rotate-left" size={4} />
                        <span>{c('collider_2025:Title').t`History`}</span>
                    </div>
                )}

                {/* Enhanced sign-in section for all guest users */}
                {isGuest && <ChatHistoryGuestUserUpsell />}
                
                {!isGuest && noConversationAtAll && (
                    <>
                        <div className="color-weak text-sm my-2 ml-3">
                            {c('collider_2025:Title').t`No chat history yet. Let's start chatting!`}
                        </div>
                    </>
                )}
                {noSearchMatch && !noConversationAtAll && (
                    <>
                        <p className="block color-weak text-sm mt-3 mb-2 mx-4">{c('collider_2025:Title')
                            .t`No result.`}</p>
                    </>
                )}
                {today.length > 0 && (
                    <>
                        <h4 className="block color-weak text-sm my-2 ml-3">{c('collider_2025:Title').t`Today`}</h4>
                        <RecentChatsList
                            conversations={today}
                            selectedConversationId={conversationId}
                            disabled={isGuest}
                            onItemClick={onItemClick}
                        />

                    </>
                )}
                {lastWeek.length > 0 && (
                    <>
                        <h4 className="block color-weak text-sm mt-3 mb-2 ml-3">
                            {c('collider_2025:Title').t`Last 7 days`}
                        </h4>
                        <RecentChatsList
                            conversations={lastWeek}
                            selectedConversationId={conversationId}
                            onItemClick={onItemClick}
                        />
                    </>
                )}
                {/* For free users, an upsell is shown when they have conversations beyond 30 days */}
                {lastMonth.length > 0 && (
                    <>
                        <h4 className="block color-weak text-sm mt-4 mb-2 ml-3">
                            {c('collider_2025:Title').t`Last 30 days`}
                        </h4>
                        {isLumoPaid ? (
                            <RecentChatsList
                                conversations={lastMonth}
                                selectedConversationId={conversationId}
                                onItemClick={onItemClick}
                            />
                        ) : (
                            // <ChatHistoryUpsell userType={lumoUserType} />
                            <ChatHistoryFreeUserUpsell />
                        )}
                    </>
                )}
                {/* Only show earlier chats for paid users */}
                {isLumoPaid && earlier.length > 0 && (
                    <>
                        <h4 className="block color-weak text-sm mt-4 mb-2 ml-2">{c('collider_2025:Title')
                            .t`Earlier`}</h4>
                        <RecentChatsList
                            conversations={earlier}
                            selectedConversationId={conversationId}
                            onItemClick={onItemClick}
                        />
                    </>
                )}
            </Scroll>
        </div>
    );
};
