import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';

import { c } from 'ttag';

// import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';

import ChatHistorySkeleton from '../../components/ChatHistorySkeleton';
import { ChatHistoryGuestUserUpsell } from '../../components/Guest/ChatHistoryUpsell.tsx/ChatHistoryUpsell';
import { useLumoUserSettings } from '../../hooks';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useConversation } from '../../providers/ConversationProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectHistoryConversationsSorted } from '../../redux/selectors';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import { LumoChatHistoryUpsell } from '../../upsells';
import RecentChatsList from './RecentChatsList';
import { categorizeConversations, searchConversations } from './helpers';

import './ChatHistory.scss';

interface Props {
    refInputSearch: React.RefObject<HTMLInputElement>;
    onItemClick?: () => void;
    searchInput?: string; // External search input value
}

export const ChatHistory = ({ onItemClick, searchInput = '' }: Props) => {
    const sortedConversations = useLumoSelector(selectHistoryConversationsSorted, shallowEqual);
    const spaceMap = useLumoSelector(selectSpaceMap, shallowEqual);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const { lumoUserSettings } = useLumoUserSettings();
    const showProjectConversationsInHistory = lumoUserSettings.showProjectConversationsInHistory ?? false;

    // Only show loading state during initial data fetch
    // const isLoading = !isGuest && !persistence.ready;
    const isLoading = false; // fixme is this correct?

    const { categorizedConversations, noConversationAtAll, noSearchMatch } = useMemo(() => {
        const empty = {
            categorizedConversations: { today: [], lastWeek: [], expiringSoon: [], lastMonth: [], earlier: [] },
            noConversationAtAll: true,
            noSearchMatch: false,
        };

        // Guest render path returns early below and never uses these values.
        if (isGuest) {
            return empty;
        }

        const conversations = showProjectConversationsInHistory
            ? sortedConversations
            : sortedConversations.filter((conversation) => {
                  const space = conversation.spaceId ? spaceMap[conversation.spaceId] : undefined;
                  return space?.isProject !== true;
              });

        const filteredConversations = searchConversations(conversations, searchInput);
        const categorizedConversations = categorizeConversations(filteredConversations, hasLumoPlus);

        return {
            categorizedConversations,
            noConversationAtAll: conversations.length === 0,
            noSearchMatch: filteredConversations.length === 0 && conversations.length > 0,
        };
    }, [sortedConversations, spaceMap, searchInput, isGuest, showProjectConversationsInHistory, hasLumoPlus]);

    const { today, lastWeek, expiringSoon, lastMonth, earlier } = categorizedConversations;

    if (isLoading) {
        return <ChatHistorySkeleton />;
    }

    if (isGuest) {
        return (
            <div className="chat-history-container flex flex-column flex-nowrap gap-2">
                {/* <Scroll className="flex-1"> */}
                <ChatHistoryGuestUserUpsell />
                {/* </Scroll> */}
            </div>
        );
    }

    return (
        <div className="chat-history-container flex flex-column flex-nowrap gap-2">
            {/* <Scroll className="flex-1"> */}
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
                    <p className="color-weak text-sm mt-3 mb-2 mx-4 hidden md:block">{c('collider_2025:Title')
                        .t`No result.`}</p>
                </>
            )}
            <div className="chat-history-list ml-5">
                {today.length > 0 && (
                    <>
                        <h4 className="color-weak text-sm my-2 ml-3 hidden md:block">{c('collider_2025:Title')
                            .t`Today`}</h4>
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
                            {!hasLumoPlus
                                ? c('collider_2025:Title').t`Last 5 days`
                                : c('collider_2025:Title').t`Last 7 days`}
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
                                <IcHourglass
                                    size={3}
                                    className="color-weak shrink-0"
                                    alt={c('collider_2025:Icon').t`Expiring soon`}
                                />
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
            {/* </Scroll> */}
        </div>
    );
};
