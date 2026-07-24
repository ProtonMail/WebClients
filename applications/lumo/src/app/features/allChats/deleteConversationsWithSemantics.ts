import { locallyDeleteConversationFromLocalRequest } from '../../redux/slices/core/conversations';
import type { ConversationMap } from '../../redux/slices/core/conversations';
import { locallyDeleteSpaceFromLocalRequest } from '../../redux/slices/core/spaces';
import type { SpaceMap } from '../../redux/slices/core/spaces';
import type { LumoDispatch } from '../../redux/store';
import type { ConversationId, SpaceId } from '../../types';

interface DeleteConversationsWithSemanticsParams {
    conversationIds: ConversationId[];
    conversationsMap: ConversationMap;
    spacesMap: SpaceMap;
    dispatch: LumoDispatch;
    removeIndexedFoldersBySpace: (spaceId: SpaceId) => Promise<void>;
    removeSearchDocumentsBySpace: (spaceId: SpaceId) => void;
}

export const getConversationIdsAffectedByDelete = (
    conversationIds: ConversationId[],
    conversationsMap: ConversationMap,
    spacesMap: SpaceMap
): Set<ConversationId> => {
    const affectedConversationIds = new Set<ConversationId>();
    const spaceIdsToDelete = new Set<SpaceId>();

    for (const conversationId of conversationIds) {
        const conversation = conversationsMap[conversationId];

        if (!conversation) {
            continue;
        }

        const space = spacesMap[conversation.spaceId];

        if (space?.isProject === true) {
            affectedConversationIds.add(conversationId);
        } else {
            spaceIdsToDelete.add(conversation.spaceId);
        }
    }

    for (const conversation of Object.values(conversationsMap)) {
        if (spaceIdsToDelete.has(conversation.spaceId)) {
            affectedConversationIds.add(conversation.id);
        }
    }

    return affectedConversationIds;
};

export const deleteConversationsWithSemantics = async ({
    conversationIds,
    conversationsMap,
    spacesMap,
    dispatch,
    removeIndexedFoldersBySpace,
    removeSearchDocumentsBySpace,
}: DeleteConversationsWithSemanticsParams): Promise<void> => {
    const conversationIdsToDelete = new Set<ConversationId>();
    const spaceIdsToDelete = new Set<SpaceId>();

    for (const conversationId of conversationIds) {
        const conversation = conversationsMap[conversationId];

        if (!conversation) {
            continue;
        }

        const space = spacesMap[conversation.spaceId];

        if (space?.isProject === true) {
            conversationIdsToDelete.add(conversationId);
        } else {
            spaceIdsToDelete.add(conversation.spaceId);
        }
    }

    for (const conversationId of conversationIdsToDelete) {
        dispatch(locallyDeleteConversationFromLocalRequest(conversationId));
    }

    for (const spaceId of spaceIdsToDelete) {
        await removeIndexedFoldersBySpace(spaceId);
        removeSearchDocumentsBySpace(spaceId);
        dispatch(locallyDeleteSpaceFromLocalRequest(spaceId));
    }
};
