import { createSelector } from '@reduxjs/toolkit';

import { selectAttachments, selectConversations, selectMessagesGroupedByConversationId } from '../../redux/selectors';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import type { LumoState } from '../../redux/store';
import type { ConversationId, Message } from '../../types';
import { getConversationPreview } from './allChatsHelpers';

// Fields derived from conversations/spaces only — never invalidated by streaming messages.
export interface AllChatsRowData {
    isProject: boolean;
    projectName?: string;
    projectIcon?: string;
}

export type AllChatsRowDataMap = Record<ConversationId, AllChatsRowData>;

export const selectAllChatsRowDataMap = createSelector(
    [selectConversations, selectSpaceMap],
    (conversations, spaces): AllChatsRowDataMap => {
        const rowDataMap: AllChatsRowDataMap = {};

        Object.values(conversations).forEach((conversation) => {
            if (conversation.ghost) {
                return;
            }

            const space = spaces[conversation.spaceId];
            const isProject = space?.isProject === true;
            const projectIcon = isProject ? space?.projectIcon : undefined;

            rowDataMap[conversation.id] = {
                isProject,
                projectName: isProject ? space?.projectName : undefined,
                projectIcon: isProject ? projectIcon : undefined,
            };
        });

        return rowDataMap;
    }
);

const EMPTY_CONVERSATION_MESSAGES: Message[] = [];

// Per-conversation preview selector — only the row whose own conversation streamed
// recomputes/re-renders, instead of invalidating the whole AllChatsRowDataMap.
export const selectConversationPreview = (id: ConversationId) =>
    createSelector(
        [
            (state: LumoState) => selectMessagesGroupedByConversationId(state)[id] ?? EMPTY_CONVERSATION_MESSAGES,
            selectAttachments,
        ],
        (messages, attachments) => getConversationPreview(messages, attachments)
    );
