import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms';
import { Icon } from '@proton/components';
import { InputFieldTwo } from '@proton/components';

import { useLumoCommon } from '../../hooks/useLumoCommon';
import { useConversation } from '../../providers/ConversationProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
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

export const ChatHistory = ({ refInputSearch, onItemClick }: Props) => {
    const conversationMap = useLumoSelector(selectConversations);
    const [searchInput, setSearchInput] = useState<string>('');
    const { conversationId } = useConversation(); //switch to using react-router-dom parameters
    const { isGuest, isLumoPaid } = useLumoCommon();
    const { isGhostChatMode } = useGhostChat();

    // Only show loading state during initial data fetch
    // const isLoading = !isGuest && !persistence.ready;
    const isLoading = false; // fixme is this correct?

    const { favorites, categorizedConversations, noConversationAtAll, noSearchMatch } = useMemo(() => {
        const conversations = getVisibleConversations(conversationMap, isGuest, isGhostChatMode, conversationId);

        const sortedConversations = conversations.sort(sortByDate('desc'));
        const favorites = sortedConversations.filter((conversation) => conversation.starred === true);
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
            <InputFieldTwo
                label={c('collider_2025:Placeholder').t`Search history`}
                labelContainerClassName="sr-only"
                dense
                className="mt-1"
                placeholder={c('collider_2025:Placeholder').t`Search history`}
                value={searchInput}
                onValue={setSearchInput}
                disabled={isGuest}
                prefix={<Icon name="magnifier" color="black" />}
                ref={refInputSearch}
            />
            {!searchInput && (
                <>
                    <h3 className="text-rg text-sm flex flex-row flex-nowrap items-center gap-2 ml-2 pl-1 mt-2">
                        <Icon name="star" className="shrink-0" />
                        <span className="mt-0.5 text-semibold">{c('collider_2025:Title').t`Favorites`}</span>
                    </h3>
                    {favorites.length > 0 ? (
                        <div className="max-h-custom overflow-y-auto" style={{ '--max-h-custom': '20%' }}>
                            <RecentChatsList
                                conversations={favorites}
                                selectedConversationId={conversationId}
                                onItemClick={onItemClick}
                            />
                        </div>
                    ) : (
                        <div className="color-weak text-sm mr-2 ml-3">
                            {c('collider_2025:Title').t`Star a chat to save it as a favorite.`}
                        </div>
                    )}
                    <hr className="mt-2 mb-0 border-bottom border-weak" />
                </>
            )}
            <Scroll className="flex-1">
                {/** feel free to remove this one if strong opposition */}
                <h3 className="text-rg text-sm flex flex-row flex-nowrap items-center ml-2 pl-1 gap-2 mt-2 mb-3">
                    <Icon name="clock-rotate-left" className="shrink-0" />
                    <span className="mt-0.5 text-semibold">{c('collider_2025:Title').t`History`}</span>
                </h3>

                {noConversationAtAll && (
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
                        {isGuest && <ChatHistoryGuestUserUpsell />}
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
