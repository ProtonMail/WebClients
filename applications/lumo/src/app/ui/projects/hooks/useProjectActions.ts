import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { generateSpaceKeyBase64 } from '../../../crypto';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectSpaceById } from '../../../redux/selectors';
import { addSpace, newSpaceId, pushSpaceRequest, locallyDeleteSpaceFromLocalRequest } from '../../../redux/slices/core/spaces';
import { addConversation, newConversationId, pushConversationRequest } from '../../../redux/slices/core/conversations';
import type { SpaceId } from '../../../types';
import { ConversationStatus } from '../../../types';

export const useProjectActions = () => {
    const dispatch = useLumoDispatch();
    const history = useHistory();

    const createProject = useCallback(
        async (projectName: string, projectInstructions?: string, files?: File[], projectIcon?: string) => {
            const createdAt = new Date().toISOString();
            const spaceId = newSpaceId();

            // Create a space marked as a project
            dispatch(
                addSpace({
                    id: spaceId,
                    createdAt,
                    spaceKey: generateSpaceKeyBase64(),
                    isProject: true,
                    projectName,
                    projectInstructions: projectInstructions || undefined,
                    projectIcon: projectIcon || undefined,
                })
            );
            dispatch(pushSpaceRequest({ id: spaceId }));

            // Navigate to the new project detail view (not a conversation)
            history.push(`/projects/${spaceId}`);

            return { spaceId };
        },
        [dispatch, history]
    );

    const createConversationInProject = useCallback(
        (spaceId: SpaceId) => {
            const createdAt = new Date().toISOString();
            const conversationId = newConversationId();

            dispatch(
                addConversation({
                    id: conversationId,
                    spaceId,
                    title: 'New chat',
                    createdAt,
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
            // Delete the space and all its conversations, messages, and attachments
            // This uses the cascade delete saga which handles all related data
            dispatch(locallyDeleteSpaceFromLocalRequest(spaceId));
            dispatch(pushSpaceRequest({ id: spaceId }));

            // Navigate to projects list after deletion
            history.push('/projects');
        },
        [dispatch, history]
    );

    return {
        createProject,
        createConversationInProject,
        updateProjectInstructions,
        deleteProject,
    };
};

