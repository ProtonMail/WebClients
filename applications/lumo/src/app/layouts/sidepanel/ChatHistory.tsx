import { useMemo } from 'react';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';

import { useLumoUserSettings } from '../../hooks';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useConversation } from '../../providers/ConversationProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectConversations } from '../../redux/selectors';
import type { Space } from '../../types';
import { sortByDate } from '../../util/date';
import ChatHistorySkeleton from '../../components/ChatHistorySkeleton';
import { ChatHistoryGuestUserUpsell } from '../../components/ChatHistoryUpsell.tsx/ChatHistoryUpsell';
import { LumoChatHistoryUpsell } from '../../upsells';
import RecentChatsList from './RecentChatsList';
import { categorizeConversations, searchConversations } from './helpers';
import { Icon } from '@proton/components';

interface Props {
    refInputSearch: React.RefObject<HTMLInputElement>;
    onItemClick?: () => void;
    searchInput?: string; // External search input value
}

/**
 * Filters conversations based on user type, ghost chat mode, and project settings
 */
const getVisibleConversations = (
    conversationMap: Record<string, any>,
    spaceMap: Record<string, Space>,
    isGuest: boolean,
    isGhostChatMode: boolean,
    showProjectConversations: boolean,
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

    return Object.values(conversationMap).filter((conversation) => {
        if (conversation.ghost) return false;
        if (!showProjectConversations) {
            const space = conversation.spaceId ? spaceMap[conversation.spaceId] : undefined;
            // Only filter out if the space is explicitly marked as a project
            if (space?.isProject === true) return false;
        }
        return true;
    });
};

export const ChatHistory = ({ onItemClick, searchInput = '' }: Props) => {
    const conversationMap = useLumoSelector(selectConversations);
    const spaceMap = useLumoSelector((state) => state.spaces) as Record<string, Space>;
    const { conversationId } = useConversation(); //switch to using react-router-dom parameters
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const { isGhostChatMode } = useGhostChat();
    const { lumoUserSettings } = useLumoUserSettings();
    const showProjectConversationsInHistory = lumoUserSettings.showProjectConversationsInHistory ?? false;

    // Only show loading state during initial data fetch
    // const isLoading = !isGuest && !persistence.ready;
    const isLoading = false; // fixme is this correct?

    const { categorizedConversations, noConversationAtAll, noSearchMatch } = useMemo(() => {
        const conversations = getVisibleConversations(
            conversationMap,
            spaceMap,
            isGuest,
            isGhostChatMode,
            showProjectConversationsInHistory,
            conversationId
        );

        // Sort by updatedAt (most recently updated conversations first)
        const sortedConversations = conversations.sort(sortByDate('desc', 'updatedAt'));
        // Exclude favorites from history - they appear in a separate section
        const nonFavorites = sortedConversations.filter((conversation) => !conversation.starred);
        const filteredConversations = searchConversations(nonFavorites, searchInput);
        const categorizedConversations = categorizeConversations(filteredConversations, hasLumoPlus);

        return {
            categorizedConversations,
            noConversationAtAll: sortedConversations.length === 0,
            noSearchMatch: filteredConversations.length === 0 && nonFavorites.length > 0,
        };
    }, [conversationMap, spaceMap, searchInput, isGuest, conversationId, isGhostChatMode, showProjectConversationsInHistory, hasLumoPlus]);

    const { today, lastWeek, expiringSoon, lastMonth, earlier } = categorizedConversations;

    if (isLoading) {
        return <ChatHistorySkeleton />;
    }

    return (
        <div className="chat-history-container flex flex-column flex-nowrap gap-2">
            <Scroll className="flex-1">
                {/* Enhanced sign-in section for all guest users */}
                {isGuest && <ChatHistoryGuestUserUpsell />}

                {!isGuest && noConversationAtAll && (
                    <>
                        <div className="color-weak text-sm my-2 ml-3 pl-6">
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
                <div className="chat-history-list ml-5">
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
                                {!hasLumoPlus ? c('collider_2025:Title').t`Last 5 days` : c('collider_2025:Title').t`Last 7 days`}
                            </h4>
                            <RecentChatsList
                                conversations={lastWeek}
                                selectedConversationId={conversationId}
                                onItemClick={onItemClick}
                            />
                        </>
                    )}
                    {/* Expiring Soon section for free users - chats that will be deleted in 0-2 days */}
                    {!hasLumoPlus && expiringSoon.length > 0 && (
                        <>
                            <div className="flex items-center justify-space-between mt-3 mb-2 ml-3 mr-3">
                                <h4 className="flex items-center gap-1 color-weak text-sm mb-0">
                                    <Icon name="hourglass" size={3} className="color-weak shrink-0" alt={c('collider_2025:Icon').t`Expiring soon`} />
                                    <span>{c('collider_2025:Title').t`Expiring Soon`}</span>
                                </h4>
                            </div>

                            <LumoChatHistoryUpsell />

                            <RecentChatsList
                                conversations={expiringSoon}
                                selectedConversationId={conversationId}
                                onItemClick={onItemClick}
                            />
                        </>
                    )}
                    {/* For free users, an upsell is shown when they have conversations beyond 30 days */}
                    {hasLumoPlus && lastMonth.length > 0 && (
                        <>
                            <h4 className="block color-weak text-sm mt-4 mb-2 ml-3">
                                {c('collider_2025:Title').t`Last 30 days`}
                            </h4>
                            <RecentChatsList
                                conversations={lastMonth}
                                selectedConversationId={conversationId}
                                onItemClick={onItemClick}
                            />
                        </>
                    )}

                    {/* Only show earlier chats for paid users */}
                    {hasLumoPlus && earlier.length > 0 && (
                        <>
                            <h4 className="block color-weak text-sm mt-4 mb-2 ml-3">{c('collider_2025:Title')
                                .t`Earlier`}</h4>

                            <RecentChatsList
                                conversations={earlier}
                                selectedConversationId={conversationId}
                                onItemClick={onItemClick}
                            />
                        </>
                    )}
                </div>
            </Scroll>
        </div>
    );
};
