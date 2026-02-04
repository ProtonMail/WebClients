import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { generateSpaceKeyBase64 } from '../../../crypto';
import { useDriveFolderIndexing } from '../../../hooks/useDriveFolderIndexing';
import { useSearchService } from '../../../hooks/useSearchService';
import { useLumoDispatch } from '../../../redux/hooks';
import { addSpace, newSpaceId, pushSpaceRequest, locallyDeleteSpaceFromLocalRequest } from '../../../redux/slices/core/spaces';
import { addConversation, newConversationId, pushConversationRequest } from '../../../redux/slices/core/conversations';
import type { SpaceId } from '../../../types';
import { ConversationStatus } from '../../../types';
import { sendProjectCreateEvent, sendProjectDeleteEvent } from '../../../util/telemetry';

export const useProjectActions = () => {
    const dispatch = useLumoDispatch();
    const history = useHistory();
    const { removeIndexedFoldersBySpace } = useDriveFolderIndexing();
    const searchService = useSearchService();

    const createProject = useCallback(
        async (projectName: string, projectInstructions?: string, files?: File[], projectIcon?: string) => {
            const now = new Date().toISOString();
            const spaceId = newSpaceId();

            // Create a space marked as a project
            dispatch(
                addSpace({
                    id: spaceId,
                    createdAt: now,
                    updatedAt: now,
                    spaceKey: generateSpaceKeyBase64(),
                    isProject: true,
                    projectName,
                    projectInstructions: projectInstructions || undefined,
                    projectIcon: projectIcon || undefined,
                })
            );
            dispatch(pushSpaceRequest({ id: spaceId }));

            sendProjectCreateEvent();

            // Navigate to the new project detail view (not a conversation)
            history.push(`/projects/${spaceId}`);

            return { spaceId };
        },
        [dispatch, history]
    );

    const createConversationInProject = useCallback(
        (spaceId: SpaceId) => {
            const now = new Date().toISOString();
            const conversationId = newConversationId();

            dispatch(
                addConversation({
                    id: conversationId,
                    spaceId,
                    title: 'New chat',
                    createdAt: now,
                    updatedAt: now,
                    status: ConversationStatus.COMPLETED,
                })
            );
            dispatch(pushConversationRequest({ id: conversationId }));

            return conversationId;
        },
        [dispatch]
    );

    const updateProjectInstructions = useCallback(
        (spaceId: SpaceId, instructions: string) => {
            // This function is deprecated - instructions are now updated directly in the modal
            // to avoid the complexity of accessing state in a callback
            console.warn('updateProjectInstructions is deprecated - use direct dispatch in modal');
        },
        []
    );

    const deleteProject = useCallback(
        async (spaceId: SpaceId) => {
            // Clean up any Drive folders indexed for this space
            await removeIndexedFoldersBySpace(spaceId);

            // Clean up search index for uploaded project files
            if (searchService) {
                searchService.removeDocumentsBySpace(spaceId);
            }

            // Delete the space and all its conversations, messages, and attachments
            // This uses the cascade delete saga which handles all related data
            dispatch(locallyDeleteSpaceFromLocalRequest(spaceId));
            dispatch(pushSpaceRequest({ id: spaceId }));

            sendProjectDeleteEvent();

            // Navigate to projects list after deletion
            history.push('/projects');
        },
        [dispatch, history, removeIndexedFoldersBySpace, searchService]
    );

    return {
        createProject,
        createConversationInProject,
        updateProjectInstructions,
        deleteProject,
    };
};

