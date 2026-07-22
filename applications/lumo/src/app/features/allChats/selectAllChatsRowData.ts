import { createSelector } from '@reduxjs/toolkit';

import { selectAttachments, selectConversations, selectMessages } from '../../redux/selectors';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import type { ConversationId } from '../../types';
import { getConversationPreview } from './allChatsHelpers';

export interface AllChatsRowData {
    preview: string;
    isProject: boolean;
    projectName?: string;
    projectIcon?: string;
}

export type AllChatsRowDataMap = Record<ConversationId, AllChatsRowData>;

export const selectAllChatsRowDataMap = createSelector(
    [selectConversations, selectMessages, selectAttachments, selectSpaceMap],
    (conversations, messages, attachments, spaces): AllChatsRowDataMap => {
        const rowDataMap: AllChatsRowDataMap = {};

        Object.values(conversations).forEach((conversation) => {
            if (conversation.ghost) {
                return;
            }

            const preview = getConversationPreview(conversation.id, messages, attachments);
            const space = spaces[conversation.spaceId];
            const isProject = space?.isProject === true;
            const projectIcon = isProject ? space?.projectIcon : undefined;

            rowDataMap[conversation.id] = {
                preview,
                isProject,
                projectName: isProject ? space?.projectName : undefined,
                projectIcon: isProject ? projectIcon : undefined,
            };
        });

        return rowDataMap;
    }
);
