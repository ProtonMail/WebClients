import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';

import { c } from 'ttag';

import ChatHistorySkeleton from '../../components/ChatHistorySkeleton';
import { useLumoUserSettings } from '../../hooks';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useConversation } from '../../providers/ConversationProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectHistoryConversationsSorted } from '../../redux/selectors';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import { LumoChatHistoryUpsell } from '../../upsells';
import RecentChatsList from './RecentChatsList';
import { applyRetentionPolicy, groupConversationsByDate, searchConversations } from './helpers';

import './ChatHistory.scss';

interface Props {
    refInputSearch: React.RefObject<HTMLInputElement>;
    onItemClick?: () => void;
    searchInput?: string;
}

export const ChatHistory = ({ onItemClick, searchInput = '' }: Props) => {
    const sortedConversations = useLumoSelector(selectHistoryConversationsSorted, shallowEqual);
    const spaceMap = useLumoSelector(selectSpaceMap, shallowEqual);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const { lumoUserSettings } = useLumoUserSettings();
    const showProjectConversationsInHistory = lumoUserSettings.showProjectConversationsInHistory ?? false;
    const dateField = lumoUserSettings.chatHistoryDateField ?? 'updatedAt';

    const isLoading = false;

    const { conversationGroups, noConversationAtAll, noSearchMatch, showHistoryUpsell } = useMemo(() => {
        const empty = {
            conversationGroups: [],
            noConversationAtAll: true,
            noSearchMatch: false,
            showHistoryUpsell: false,
        };

        if (isGuest) {
            return empty;
        }

        const conversations = showProjectConversationsInHistory
            ? sortedConversations
            : sortedConversations.filter((conversation) => {
                  const space = conversation.spaceId ? spaceMap[conversation.spaceId] : undefined;
                  return space?.isProject !== true;
              });

        const retainedConversations = applyRetentionPolicy(conversations, hasLumoPlus);
        const filteredConversations = searchConversations(retainedConversations, searchInput);
        const conversationGroups = groupConversationsByDate(filteredConversations, { sortBy: dateField });

        return {
            conversationGroups,
            noConversationAtAll: conversations.length === 0,
            noSearchMatch: filteredConversations.length === 0 && conversations.length > 0,
            showHistoryUpsell: !hasLumoPlus && retainedConversations.length > 0,
        };
    }, [sortedConversations, spaceMap, searchInput, isGuest, showProjectConversationsInHistory, dateField, hasLumoPlus]);

    if (isLoading) {
        return <ChatHistorySkeleton />;
    }

    if (isGuest) {
        return null;
    }

    return (
        <div className="chat-history-container flex flex-column flex-nowrap gap-2">
            {!isGuest && noConversationAtAll && (
                <div className="color-weak text-sm my-2 px-1.5">
                    {c('collider_2025:Title').t`No chat history yet. Let's start chatting!`}
                </div>
            )}
            {noSearchMatch && !noConversationAtAll && (
                <p className="color-weak text-sm mt-3 mb-2 mx-4 hidden md:block">{c('collider_2025:Title')
                    .t`No result.`}</p>
            )}
            <div className="chat-history-list">
                {showHistoryUpsell && <LumoChatHistoryUpsell />}
                {conversationGroups.map((group, index) => (
                    <div key={group.key}>
                        <h4 className={`block color-weak text-sm px-1.5 ${index === 0 ? 'my-2' : 'mt-3 mb-2'}`}>
                            {group.title}
                        </h4>
                        <RecentChatsList
                            conversations={group.conversations}
                            selectedConversationId={conversationId}
                            disabled={isGuest}
                            onItemClick={onItemClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
