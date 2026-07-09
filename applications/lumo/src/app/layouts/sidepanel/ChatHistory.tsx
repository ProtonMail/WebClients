import { memo, useEffect, useMemo } from 'react';
import { shallowEqual } from 'react-redux';

import { startOfDay, subDays } from 'date-fns';
import { c } from 'ttag';

import { LumoLink } from '../../components/Links/LumoLink';
import { FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import { useLumoUserSettings } from '../../hooks';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useConversation } from '../../providers/ConversationProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { historyRowsEqual, selectConversationById, selectHistoryConversationRows } from '../../redux/selectors';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import { ConversationListItem } from './RecentChatsList';
import { CONVERSATION_DATE_GROUP_ORDER, getConversationDateGroupTitle } from './helpers';

import './ChatHistory.scss';

const SIDEBAR_CHAT_HISTORY_LIMIT = 20;

interface ConnectedItemProps {
    id: string;
    isSelected: boolean;
    isTouchDevice: boolean;
    onItemClick?: () => void;
}

const ConnectedConversationListItem = memo(({ id, isSelected, isTouchDevice, onItemClick }: ConnectedItemProps) => {
    const conversation = useLumoSelector(selectConversationById(id));

    if (!conversation) {
        return null;
    }

    return (
        <ConversationListItem
            conversation={conversation}
            isSelected={isSelected}
            showDropdown
            isTouchDevice={isTouchDevice}
            onItemClick={onItemClick}
        />
    );
});

ConnectedConversationListItem.displayName = 'ConnectedConversationListItem';

interface Props {
    onItemClick?: () => void;
}

export const ChatHistory = ({ onItemClick }: Props) => {
    const conversationRows = useLumoSelector(selectHistoryConversationRows, historyRowsEqual);
    const spaceMap = useLumoSelector(selectSpaceMap, shallowEqual);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const { lumoUserSettings } = useLumoUserSettings();
    const showProjectConversationsInHistory = lumoUserSettings.showProjectConversationsInHistory ?? false;
    const isTouchDevice = useIsTouchDevice();

    useEffect(() => {
        console.log('[ChatHistory] mounted with', conversationRows.length, 'conversations');
    }, []);

    const { conversationGroups, noConversationAtAll } = useMemo(() => {
        if (isGuest) {
            return { conversationGroups: [], noConversationAtAll: true };
        }

        const filteredRows = showProjectConversationsInHistory
            ? conversationRows
            : conversationRows.filter((row) => {
                  const space = row.spaceId ? spaceMap[row.spaceId] : undefined;
                  return space?.isProject !== true;
              });

        let retainedRows = filteredRows;
        if (!hasLumoPlus) {
            const cutoff = subDays(startOfDay(new Date()), FREE_USER_CHAT_RETENTION_DAYS);
            retainedRows = filteredRows.filter((row) => startOfDay(new Date(row.createdAt)) >= cutoff);
        }

        const cappedRows = retainedRows.slice(0, SIDEBAR_CHAT_HISTORY_LIMIT);

        const groupMap = new Map<string, string[]>();
        for (const row of cappedRows) {
            const existing = groupMap.get(row.groupKey);
            if (existing) {
                existing.push(row.id);
            } else {
                groupMap.set(row.groupKey, [row.id]);
            }
        }

        const conversationGroups = CONVERSATION_DATE_GROUP_ORDER.filter((key) => groupMap.has(key)).map((key) => ({
            key,
            title: getConversationDateGroupTitle(key),
            ids: groupMap.get(key)!,
        }));

        return {
            conversationGroups,
            noConversationAtAll: filteredRows.length === 0,
        };
    }, [conversationRows, spaceMap, isGuest, showProjectConversationsInHistory, hasLumoPlus]);

    if (isGuest) {
        return null;
    }

    return (
        <div className="chat-history-container flex flex-column flex-nowrap gap-2 min-w-0 overflow-hidden">
            {noConversationAtAll && (
                <div className="color-weak text-sm my-2 px-1.5">
                    {c('collider_2025:Title').t`No chat history yet. Let's start chatting!`}
                </div>
            )}
            <div className="chat-history-list">
                {conversationGroups.map((group, index) => (
                    <div key={group.key}>
                        <h4 className={`block color-weak text-sm px-1.5 ${index === 0 ? 'my-2' : 'mt-3 mb-2'}`}>
                            {group.title}
                        </h4>
                        <ul className="unstyled flex flex-column flex-nowrap gap-0.5 min-w-0 w-full my-0">
                            {group.ids.map((id) => (
                                <ConnectedConversationListItem
                                    key={id}
                                    id={id}
                                    isSelected={id === conversationId}
                                    isTouchDevice={isTouchDevice}
                                    onItemClick={onItemClick}
                                />
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            {conversationRows.length > SIDEBAR_CHAT_HISTORY_LIMIT && (
                <LumoLink
                    to="/chats"
                    className="block text-sm color-weak px-1.5 py-2 hover:color-norm"
                    onClick={onItemClick}
                >
                    {c('collider_2025:Link').t`All chats`}
                </LumoLink>
            )}
        </div>
    );
};
