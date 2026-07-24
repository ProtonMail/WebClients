import { createSelector } from '@reduxjs/toolkit';

import { selectConversations } from '../../redux/selectors';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import type { ConversationId } from '../../types';

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
