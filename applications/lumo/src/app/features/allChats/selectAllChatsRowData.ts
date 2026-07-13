import { createSelector } from '@reduxjs/toolkit';

import type { IconName } from '../../components/LumoIcon/LumoIcon';
import { selectAttachments, selectConversations, selectMessages } from '../../redux/selectors';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import type { ConversationId } from '../../types';
import { conversationHasImages, getConversationPreview } from './allChatsHelpers';
import { deriveChatRowIcon } from './chatCategory';

export interface AllChatsRowData {
    preview: string;
    hasImages: boolean;
    icon: IconName;
    isProject: boolean;
    projectName?: string;
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
            const hasImages = conversationHasImages(conversation.id, messages, attachments);
            const space = spaces[conversation.spaceId];
            const isProject = space?.isProject === true;
            const projectIcon = isProject ? space?.projectIcon : undefined;

            rowDataMap[conversation.id] = {
                preview,
                hasImages,
                icon: deriveChatRowIcon({
                    projectIcon,
                    isProject,
                    hasImages,
                }),
                isProject,
                projectName: isProject ? space?.projectName : undefined,
            };
        });

        return rowDataMap;
    }
);
