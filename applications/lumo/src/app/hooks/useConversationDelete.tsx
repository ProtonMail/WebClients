import { useCallback } from 'react';

import { c } from 'ttag';

import { useModalStateObject, useNotifications } from '@proton/components';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectConversationsBySpaceId, selectSpaceById } from '../redux/selectors';
import { locallyDeleteConversationFromLocalRequest } from '../redux/slices/core/conversations';
import { locallyDeleteSpaceFromLocalRequest, pushSpaceRequest } from '../redux/slices/core/spaces';
import type { Conversation } from '../types';
import { sendConversationDeleteEvent } from '../util/telemetry';
import { useDriveFolderIndexing } from './useDriveFolderIndexing';
import { useLumoNavigate } from './useLumoNavigate';
import { useSearchService } from './useSearchService';

interface UseConversationDeleteProps {
    conversation: Conversation;
}

export const useConversationDelete = ({ conversation }: UseConversationDeleteProps) => {
    const { id: conversationId, spaceId } = conversation;
    const dispatch = useLumoDispatch();
    const navigate = useLumoNavigate();
    const { createNotification } = useNotifications();
    const confirmDeleteModal = useModalStateObject();
    const { removeIndexedFoldersBySpace } = useDriveFolderIndexing();
    const searchService = useSearchService();
    const space = useLumoSelector(selectSpaceById(spaceId));
    const conversationsInSpace = useLumoSelector(selectConversationsBySpaceId(spaceId));

    const openConfirmationModal = useCallback(() => {
        confirmDeleteModal.openModal(true);
    }, [confirmDeleteModal]);

    const handleDelete = useCallback(async () => {
        sendConversationDeleteEvent();

        // Project spaces and any space with more than one chat only delete the conversation (legacy 1:1 was space delete)
        const deleteConversationOnly = space?.isProject === true;

        try {
            if (deleteConversationOnly) {
                dispatch(locallyDeleteConversationFromLocalRequest(conversationId));
            } else {
                await removeIndexedFoldersBySpace(spaceId);

                if (searchService) {
                    searchService.removeDocumentsBySpace(spaceId);
                }

                dispatch(locallyDeleteSpaceFromLocalRequest(spaceId));
                dispatch(pushSpaceRequest({ id: spaceId }));
            }

            createNotification({ text: c('Success').jt`Conversation deleted` });
        } catch (error) {
            createNotification({ text: <>{error}</>, type: 'error' });
        }

        confirmDeleteModal.openModal(false);
        navigate('/');
    }, [
        conversationId,
        spaceId,
        space?.isProject,
        conversationsInSpace,
        dispatch,
        createNotification,
        confirmDeleteModal,
        navigate,
        removeIndexedFoldersBySpace,
        searchService,
    ]);

    return {
        openConfirmationModal,
        showConfirmDeleteModal: confirmDeleteModal.render,
        confirmDeleteModalProps: confirmDeleteModal.modalProps,
        handleDelete,
    };
};
